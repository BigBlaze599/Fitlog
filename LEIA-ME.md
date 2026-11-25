# FITLOG — MVP de academia

Aplicativo React Native/Expo para cadastrar exercícios, registrar suas conclusões e consultar o histórico. O projeto tem três telas, tema escuro e persistência externa no Supabase quando configurado. Sem configuração, funciona em modo demonstração com dados locais separados dos dados externos.

## 1. Configure o banco de dados

1. Acesse https://supabase.com/dashboard e crie um projeto (recomendado: separado do NEXFIT).
2. Abra SQL Editor > New query, copie todo o conteúdo de `supabase.sql` e clique em Run.
3. Em Authentication, procure a configuração **Allow anonymous sign-ins** (login anônimo) e habilite. Use somente em um projeto de testes; para publicação aberta, proteja o fluxo contra abuso (por exemplo, com CAPTCHA). A sessão anônima fica no dispositivo e não pode ser recuperada após apagar os dados ou reinstalar.
4. No painel do projeto (Connect ou Project Settings > API Keys), copie a Project URL e a chave Publishable (`sb_publishable_...`) ou a chave anon legada. Nunca use `service_role` ou `sb_secret_...`.
5. No início do arquivo `App.js`, preencha `SUPABASE_URL` e `SUPABASE_KEY` com os valores, entre aspas. Sem as duas informações, o app permanece no modo DEMO LOCAL; dados desse modo não são enviados automaticamente para o Supabase.
6. Ao abrir a versão configurada, confira se aparece SUPABASE no cabeçalho. A sessão é criada automaticamente; as políticas RLS permitem ler/inserir somente registros pertencentes ao usuário atual.

## 2. Abra no Expo Snack

1. Entre em https://snack.expo.dev/ e faça login.
2. Crie um Snack com o nome FITLOG. Substitua todo o conteúdo de App.js pelo App.js deste pacote, já com a configuração do Supabase.
3. Crie a pasta `assets` no Snack e envie o arquivo `assets/logo.png` deste pacote (mantendo o mesmo nome e caminho). Adicione as dependências abaixo pela interface de dependências do Snack ou pelo package.json do Snack:
   - `@supabase/supabase-js` (versão 2.x)
   - `react-native-url-polyfill` (2.x)
   - `@react-native-async-storage/async-storage` (versão compatível com o SDK selecionado)
   - `react-native-safe-area-context` (versão compatível com o SDK selecionado)
4. Selecione Android para visualizar, ou use o Expo Go no celular com SDK compatível. Teste cadastro, conclusão e histórico. Salve o Snack e copie a URL do projeto salvo: esse é o link exigido pelo professor.
5. Exporte/baixe o projeto do Snack em ZIP e extraia-o no seu computador. Use essa versão exportada para gerar o APK, como pede o slide. O projeto deste pacote também pode ser aberto localmente (base Expo SDK 54, React Native 0.81), caso queira testar fora do Snack.

## 3. Compile o APK

Pré-requisitos: Node.js LTS compatível com o SDK, conexão de internet e conta Expo. O EAS Build compila na nuvem; uma VM AWS não é obrigatória. O perfil preview gera APK instalável, não AAB.

Na pasta exportada do Snack, copie `eas.json`, a pasta `assets` completa e as configurações de `icon`, `android.adaptiveIcon` e `plugins` do `app.json` deste pacote. Se preferir compilar diretamente este ZIP, esses arquivos já estão integrados. Garanta que o `app.json` da exportação contenha `name`, `slug` e `android.package` (ex.: `com.fitlog.mvp`), preservando as outras configurações. Confirme que o App.js exportado tem a URL e a chave publicável corretas. No terminal (PowerShell ou CMD):

```sh
npm install
npx expo install expo-splash-screen
npx expo install --fix
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest build --platform android --profile preview
```

Caso o EAS solicite vincular ou criar um projeto Expo, autorize. Se solicitar uma keystore Android, permita gerar uma nova para este app. Se o `build:configure` modificar `eas.json`, confirme que o perfil preview ainda tem `android.buildType` igual a `apk`.

Quando a compilação estiver concluída, abra o link do build no terminal ou em https://expo.dev/accounts e baixe o APK. Instale-o no Android, confira o banco externo e envie o APK para o portal do professor. Não envie apenas este ZIP: ele contém código-fonte, não o APK.

Documentação: https://docs.expo.dev/build-reference/apk/ e https://docs.expo.dev/build/setup/.

## Identidade visual

A logo fornecida está em `assets/logo.png` e é exibida no cabeçalho das três telas. O fundo claro no cabeçalho mantém a legibilidade da arte original. `icon.png` é o ícone padrão, `adaptive-icon.png` é o ícone adaptativo do Android e `splash-icon.png` é usado na abertura nativa. Os ícones usam o símbolo da mesma logo, sem o texto, para evitar cortes e facilitar a leitura em tamanhos pequenos. O ícone e a abertura nativa devem ser conferidos no APK compilado, não apenas no Expo Go.

## 4. Validação da hipótese

Convide de 3 a 5 praticantes de musculação para testar (sugestão, não exigência numérica do slide). Use `validacao.md` para registrar os resultados reais, sem coletar informações pessoais desnecessárias.

## 5. Entrega

- Link público/compartilhável do Snack salvo.
- APK compilado e testado, pronto para o portal.
- Registro da validação (para comprovar o objetivo do slide).

## Limitações deste pacote

O código foi preparado e submetido a verificação estática de sintaxe. Não foi executado em um emulador ou em um Supabase real neste ambiente: faltam o projeto/credenciais e acesso à compilação Expo. A publicação do Snack, a geração do APK e a validação com pessoas ainda precisam ser feitas. O modo local é apenas para demonstração, não cumpre a exigência de registro externo.
