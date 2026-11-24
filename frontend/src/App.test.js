import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import api from './utils/api';

// Evita chamadas reais à API (e carregar o axios dentro do Jest)
jest.mock('./utils/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

let banco;

beforeEach(() => {
  banco = [{ id: 1, nome: 'Mouse', preco: 50.5 }];
  window.history.pushState({}, '', '/');
  window.alert = jest.fn();
  window.confirm = jest.fn(() => true);

  api.get.mockImplementation(async () => ({ data: [...banco] }));
  api.post.mockImplementation(async (url, dados) => {
    banco.push({ id: banco.length + 10, ...dados });
    return { data: { message: 'Produto criado com sucesso' } };
  });
  api.patch.mockImplementation(async (url, dados) => {
    const id = Number(url.split('/').pop());
    banco = banco.map((p) => (p.id === id ? { ...p, ...dados } : p));
    return { data: { message: 'Produto atualizado com sucesso' } };
  });
  api.delete.mockImplementation(async (url) => {
    const id = Number(url.split('/').pop());
    banco = banco.filter((p) => p.id !== id);
    return { data: { message: 'Produto deletado com sucesso' } };
  });
});

function abrirProdutos() {
  window.history.pushState({}, '', '/produtos');
  render(<App />);
}

test('renderiza a Home e a navbar', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Produtos' })).toBeInTheDocument();
});

test('lista os produtos vindos da API ao abrir a página', async () => {
  abrirProdutos();
  expect(screen.getByText('Carregando...')).toBeInTheDocument();
  expect(await screen.findByText('Mouse')).toBeInTheDocument();
  expect(screen.getByText('R$ 50,50')).toBeInTheDocument();
  expect(api.get).toHaveBeenCalledWith('/produto/getAll');
});

test('mostra mensagem quando não há produtos', async () => {
  banco = [];
  abrirProdutos();
  expect(await screen.findByText('Nenhum produto encontrado')).toBeInTheDocument();
});

test('mostra erro quando a API está fora do ar', async () => {
  api.get.mockRejectedValue({ request: {} });
  abrirProdutos();
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível conectar à API');
});

test('não envia para a API sem nome ou sem preço', async () => {
  abrirProdutos();
  await screen.findByText('Mouse');

  userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
  expect(window.alert).toHaveBeenCalledWith('O campo nome é obrigatório');

  userEvent.type(screen.getByPlaceholderText('Nome do Produto'), 'Teclado');
  userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
  expect(window.alert).toHaveBeenCalledWith('O campo preço é obrigatório');

  expect(api.post).not.toHaveBeenCalled();
});

test('cadastra produto na API, recarrega a lista e limpa o formulário', async () => {
  abrirProdutos();
  await screen.findByText('Mouse');

  userEvent.type(screen.getByPlaceholderText('Nome do Produto'), 'Teclado');
  userEvent.type(screen.getByPlaceholderText('Preço do Produto'), '120');
  userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

  expect(await screen.findByText('Teclado')).toBeInTheDocument();
  expect(api.post).toHaveBeenCalledWith('/produto/create', { nome: 'Teclado', preco: 120 });
  expect(screen.getByPlaceholderText('Nome do Produto')).toHaveValue('');
});

test('mostra a mensagem de erro retornada pela API ao cadastrar', async () => {
  api.post.mockRejectedValue({ response: { data: { message: 'O nome é obrigatório' } } });
  abrirProdutos();
  await screen.findByText('Mouse');

  userEvent.type(screen.getByPlaceholderText('Nome do Produto'), 'X');
  userEvent.type(screen.getByPlaceholderText('Preço do Produto'), '1');
  userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

  expect(await screen.findByRole('alert')).toHaveTextContent('O nome é obrigatório');
});

test('edita um produto existente', async () => {
  abrirProdutos();
  await screen.findByText('Mouse');

  userEvent.click(screen.getByRole('button', { name: 'Editar' }));
  expect(screen.getByPlaceholderText('Nome do Produto')).toHaveValue('Mouse');
  expect(screen.getByPlaceholderText('Preço do Produto')).toHaveValue(50.5);

  userEvent.clear(screen.getByPlaceholderText('Nome do Produto'));
  userEvent.type(screen.getByPlaceholderText('Nome do Produto'), 'Mouse Gamer');
  userEvent.click(screen.getByRole('button', { name: 'Atualizar' }));

  expect(await screen.findByText('Mouse Gamer')).toBeInTheDocument();
  expect(api.patch).toHaveBeenCalledWith('/produto/update/1', { nome: 'Mouse Gamer', preco: 50.5 });
  expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument();
});

test('cancelar a edição limpa o formulário', async () => {
  abrirProdutos();
  await screen.findByText('Mouse');

  userEvent.click(screen.getByRole('button', { name: 'Editar' }));
  userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

  expect(screen.getByPlaceholderText('Nome do Produto')).toHaveValue('');
  expect(api.patch).not.toHaveBeenCalled();
});

test('exclui um produto após confirmar', async () => {
  abrirProdutos();
  await screen.findByText('Mouse');

  userEvent.click(screen.getByRole('button', { name: 'Excluir' }));

  await waitFor(() => expect(screen.getByText('Nenhum produto encontrado')).toBeInTheDocument());
  expect(api.delete).toHaveBeenCalledWith('/produto/delete/1');
});

test('não exclui se o usuário cancelar a confirmação', async () => {
  window.confirm = jest.fn(() => false);
  abrirProdutos();
  await screen.findByText('Mouse');

  userEvent.click(screen.getByRole('button', { name: 'Excluir' }));

  expect(api.delete).not.toHaveBeenCalled();
  expect(screen.getByText('Mouse')).toBeInTheDocument();
});
