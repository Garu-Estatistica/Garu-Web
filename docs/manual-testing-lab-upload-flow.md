# Manual testing notes for the lab CSV upload flow

## 1. Happy path

1. Open the Meu Laboratório page.
2. Click the "Acessar conjuntos de dados" button and confirm the route opens.
3. Return to the upload area and select a CSV with header and numeric columns.
4. Review the detected types and switch any numeric-coded categorical columns to "Categórica".
5. Choose whether the file has an ID column.
6. Confirm and verify that the analysis tabs become available.

## 2. Decimal validation

- Use `1.75` for decimal values.
- A file using `1,75` should show an explanatory validation message.

## 3. ID column flow

- For a file with an ID column, select it in the review step.
- For a file without an ID, choose "Não" and confirm that the first column remains available for analysis.

## 4. Known project limitation

The repo's full build is currently blocked by a pre-existing missing image import in the Types Variáveis page. The CSV import flow itself was validated with Vitest and by running the Vite dev server.
