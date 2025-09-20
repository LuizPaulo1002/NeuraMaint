# Relatório de Limpeza do Sistema

## Resumo

Este relatório detalha os arquivos e diretórios identificados como desnecessários no seu sistema que podem ser removidos para liberar espaço e melhorar a organização.

**Data da análise:** 2025-09-18
**Total de itens identificados:** 7
**Espaço total que pode ser liberado:** 796.44 MB

## Itens para Limpeza

| Caminho Completo | Tipo | Tamanho | Data de Modificação | Justificativa |
|------------------|------|---------|---------------------|---------------|
| C:\Users\Jônatas Felipe\Desktop\NeuraMaint\frontend\node_modules | Diretório | 366.75 MB | 2025-09-03 | Diretório de cache de dependências |
| C:\Users\Jônatas Felipe\Desktop\NeuraMaint\backend\node_modules | Diretório | 305.81 MB | 2025-09-09 | Diretório de cache de dependências |
| C:\Users\Jônatas Felipe\Desktop\NeuraMaint\node_modules | Diretório | 72.61 MB | 2025-08-25 | Diretório de cache de dependências |
| C:\Users\Jônatas Felipe\Desktop\NeuraMaint\frontend\.next | Diretório | 50.65 MB | 2025-09-03 | Cache de build do Next.js |
| C:\Users\Jônatas Felipe\Desktop\NeuraMaint\backend\dist | Diretório | 526.9 KB | 2025-08-23 | Artefatos de build |
| C:\Users\Jônatas Felipe\Desktop\NeuraMaint\backend\logs | Diretório | 68.45 KB | 2025-09-07 | Diretório de arquivos de log |
| C:\Users\Jônatas Felipe\Desktop\NeuraMaint\ml-service\__pycache__ | Diretório | 36.2 KB | 2025-08-23 | Diretório de cache do Python |

## Classificação por Tamanho

1. **frontend\node_modules** - 366.75 MB
2. **backend\node_modules** - 305.81 MB
3. **node_modules** - 72.61 MB
4. **frontend\.next** - 50.65 MB
5. **backend\dist** - 526.9 KB
6. **backend\logs** - 68.45 KB
7. **ml-service\__pycache__** - 36.2 KB

## Importante

Antes de prosseguir com a exclusão:
- Verifique se você não precisa dos diretórios de dependência ([node_modules](file:///c%3A/Users/J%C3%B4natas%20Felipe/Desktop/NeuraMaint/frontend/node_modules)) para desenvolvimento
- Certifique-se de que os logs não contenham informações importantes
- Lembre-se de que você pode reinstalar dependências usando `npm install` ou `yarn install`

## Recomendações para Manutenção Futura

1. **Adicione entradas ao .gitignore**:
   ```
   node_modules/
   .next/
   dist/
   logs/
   __pycache__/
   *.log
   ```

2. **Crie um script de limpeza automática**:
   Um script que possa ser executado periodicamente para remover arquivos temporários e caches.

3. **Use ferramentas de limpeza**:
   - Para Node.js: `npm prune` para remover pacotes não utilizados
   - Para Python: `python -m pip cache purge` para limpar o cache do pip

## Autorização Necessária

Por favor, confirme se você autoriza a exclusão desses arquivos e diretórios. Nenhuma exclusão será realizada sem sua aprovação explícita.