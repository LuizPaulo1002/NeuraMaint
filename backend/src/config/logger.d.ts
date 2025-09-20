declare const logger: {
  info: (message: string, meta?: any) => void;
  error: (message: string, meta?: any) => void;
  warn: (message: string, meta?: any) => void;
  debug: (message: string, meta?: any) => void;
  http: (message: string, meta?: any) => void;
  performance: {
    apiCall: (method: string, url: string, duration: number, statusCode: number, userId?: number) => void;
  };
};

export default logger;