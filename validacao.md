# FITLOG — ficha de validação do MVP

**Problema real:** praticantes de musculação têm dificuldade em organizar exercícios e registrar o que realizaram.

**Hipótese:** um aplicativo que organize exercícios e guarde seu histórico pode facilitar o acompanhamento da rotina.

**Teste sugerido:** 3 a 5 voluntários que praticam musculação, preferencialmente fora da escola. Não inclua nomes completos nem dados de saúde. Peça que cada participante use a versão com Supabase configurado.

## Tarefas

1. Cadastrar um exercício (nome, séries, repetições, carga).
2. Registrar uma conclusão na aba Treinos.
3. Encontrar o registro no Histórico; fechar e reabrir o app e conferir se os dados permanecem.

## Perguntas

- Você conseguiu realizar as três tarefas sem ajuda?
- Foi fácil entender a navegação? (1 a 5)
- O app ajudaria a organizar seu treino? (1 a 5)
- Qual dificuldade encontrou? O que mudaria?

| Participante | Cadastro | Conclusão | Histórico e persistência | Navegação (1–5) | Utilidade (1–5) | Comentário |
|---|---|---|---|---|---|---|
| P1 | | | | | | |
| P2 | | | | | | |
| P3 | | | | | | |
| P4 (opcional) | | | | | | |
| P5 (opcional) | | | | | | |

**Critério sugerido:** pelo menos 80% dos participantes completam as três tarefas sem ajuda e avaliam a utilidade com nota 4 ou 5. Registre a amostra, dificuldades e conclusão. Uma amostra pequena fornece somente evidência inicial, não prova eficácia.

Resultado observado: [preencher depois dos testes reais].

## Testes técnicos antes da entrega

- [ ] App abre sem erros em Android.
- [ ] Cadastro rejeita campos vazios e números inválidos.
- [ ] Cadastro cria uma linha em `fitlog_exercises` no Supabase.
- [ ] Conclusão cria uma linha em `fitlog_logs` no Supabase.
- [ ] Histórico exibe data e valores cadastrados.
- [ ] Após fechar e reabrir o app os registros permanecem.
- [ ] Uma segunda instalação/sessão anônima não acessa registros da primeira.
- [ ] APK instalado e executado no celular.
- [ ] Link salvo do Snack abre para o professor.
