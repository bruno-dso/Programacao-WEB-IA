const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
const TAMANHO_MAXIMO = 2 * 1024 * 1024; // 2 MB

// Tipos aceitos: apenas JPEG e PNG
const TIPOS = {
    'image/jpeg': { extensoes: ['.jpg', '.jpeg'], assinatura: [0xFF, 0xD8, 0xFF] },
    'image/png': { extensoes: ['.png'], assinatura: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] }
};

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    // Nome gerado pelo servidor: nunca usamos o nome enviado pelo cliente
    filename: (req, file, cb) => {
        const ext = file.mimetype === 'image/png' ? '.png' : '.jpg';
        cb(null, `${crypto.randomUUID()}${ext}`);
    }
});

// 1ª barreira: mimetype + extensão declarados
function fileFilter(req, file, cb) {
    const tipo = TIPOS[file.mimetype];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!tipo || !tipo.extensoes.includes(ext)) {
        return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'imagem'));
    }
    cb(null, true);
}

const upload = multer({ storage, fileFilter, limits: { fileSize: TAMANHO_MAXIMO, files: 1 } }).single('imagem');

// 2ª barreira: confere os bytes iniciais do arquivo (o mimetype/extensão podem ser forjados)
function assinaturaValida(caminho, mimetype) {
    const esperado = TIPOS[mimetype]?.assinatura;
    if (!esperado) return false;
    const buf = Buffer.alloc(esperado.length);
    const fd = fs.openSync(caminho, 'r');
    try {
        fs.readSync(fd, buf, 0, esperado.length, 0);
    } finally {
        fs.closeSync(fd);
    }
    return esperado.every((byte, i) => buf[i] === byte);
}

function removerArquivo(nomeArquivo) {
    if (!nomeArquivo) return;
    // path.basename evita sair da pasta uploads
    fs.unlink(path.join(UPLOAD_DIR, path.basename(nomeArquivo)), () => {});
}

// Middleware: processa o upload opcional e responde 422 em caso de arquivo inválido
function uploadImagem(req, res, next) {
    upload(req, res, (err) => {
        if (err) {
            let message = 'Erro ao enviar a imagem';
            if (err.code === 'LIMIT_FILE_SIZE') message = 'A imagem deve ter no máximo 2 MB';
            else if (err.code === 'LIMIT_UNEXPECTED_FILE') message = 'Imagem inválida: envie apenas arquivos .jpeg, .jpg ou .png';
            return res.status(422).json({ message });
        }
        if (req.file && !assinaturaValida(req.file.path, req.file.mimetype)) {
            removerArquivo(req.file.filename);
            return res.status(422).json({ message: 'O arquivo enviado não é uma imagem JPEG ou PNG válida' });
        }
        next();
    });
}

module.exports = { uploadImagem, removerArquivo, UPLOAD_DIR };