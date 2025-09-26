// Este ficheiro "engana" o Jest, fornecendo uma versão falsa do Sentry
// que não faz nada, evitando erros nos testes.

export const init = jest.fn();

export const Handlers = {
  requestHandler: () => (req, res, next) => next(),
  errorHandler: () => (err, req, res, next) => {
    // Apenas para o caso de um erro chegar aqui durante um teste
    console.error("Sentry mock captured error:", err);
    if (res.headersSent) {
      return next(err);
    }
    res.status(500).send('Internal Server Error');
  },
};

export const captureException = jest.fn();