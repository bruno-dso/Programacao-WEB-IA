import { urlImagem } from "../../utils/api";
import { moeda } from "../../utils/moeda";

const CardProduto = ({ produto, onAdicionar, desabilitado }) => {
    return (
        <div className="card h-100 shadow-sm">
            {produto.imagem ? (
                <img
                    src={urlImagem(produto.imagem)}
                    className="card-img-top"
                    alt={produto.nome}
                    loading="lazy"
                    style={{ height: 180, objectFit: 'cover' }}/>
            ) : (
                <div
                    className="bg-light text-muted d-flex align-items-center justify-content-center"
                    style={{ height: 180 }}>
                    Sem imagem
                </div>
            )}
            <div className="card-body d-flex flex-column">
                <h2 className="card-title fs-6">{produto.nome}</h2>
                <p className="fs-5 fw-bold mt-auto mb-2">{moeda(produto.preco)}</p>
                <button
                    className="btn btn-primary"
                    type="button"
                    onClick={() => onAdicionar(produto)}
                    disabled={desabilitado}>
                    Adicionar ao carrinho
                </button>
            </div>
        </div>
    )
}

export default CardProduto;