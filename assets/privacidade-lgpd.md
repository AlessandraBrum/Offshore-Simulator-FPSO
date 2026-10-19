# Offshore Simulator · Guia de dados salvos e LGPD

Guia passo a passo para entender como o jogo guarda o progresso, o que a LGPD pede e como alguém pode entrar em contato com você sobre privacidade.

---

## Parte 1 · Como o jogo salva o progresso

### Passo 1 · O que é o "cache" que o jogo usa
O jogo não usa exatamente o cache. Ele usa o **localStorage**, uma pequena gaveta que todo navegador oferece a cada site. Diferenças importantes:

- O **cache** guarda cópias de arquivos (imagens, scripts) para o site abrir mais rápido. O navegador decide quando apagar.
- O **localStorage** guarda pares de texto, no formato nome e valor, que o próprio site grava. Os dados só somem quando o site apaga ou quando a pessoa limpa os dados do navegador.

Cada site tem a sua gaveta, separada das gavetas dos outros sites. Ela fica só naquele navegador, naquele aparelho. Se a pessoa abrir o jogo no celular, o progresso do computador não aparece lá.

### Passo 2 · O que o Offshore Simulator grava

| Nome (chave) | Exemplo de valor | Para que serve | Quando é gravado |
|---|---|---|---|
| `oc-consent` | `yes` ou `no` | Lembrar a resposta ao aviso de privacidade | Assim que a pessoa responde |
| `oc-progress` | `["phase2"]` | Lista de fases concluídas | Só com consentimento |
| `oc-motion` | `off` | Lembrar que a pessoa desligou as animações | Só com consentimento |

Nada além disso. Nenhum nome, e-mail, IP ou identificador.

### Passo 3 · Como isso aparece no código
Em `js/main.js`, o bloco **1.1 Armazenamento com consentimento** controla tudo:

```js
Store.set('oc-progress', '["phase2"]');   // só grava se oc-consent for "yes"
Store.get('oc-progress');                // só lê se oc-consent for "yes"
Store.eraseAll();                         // apaga progresso e preferência
```

Por baixo, ele usa os comandos do navegador `localStorage.setItem`, `getItem` e `removeItem`. Cada comando fica dentro de um `try/catch`: se o navegador bloquear o armazenamento (aba anônima, por exemplo), o jogo continua funcionando, só não lembra nada.

### Passo 4 · Como ver os dados com seus próprios olhos
1. Abra o jogo no Chrome ou no Edge.
2. Aperte **F12**, ou clique com o botão direito e escolha **Inspecionar**.
3. Vá na aba **Application** (no Firefox, **Armazenamento**).
4. No menu da esquerda, abra **Local Storage** e clique no endereço do jogo.
5. Aparecem as chaves `oc-consent`, `oc-progress` e `oc-motion`. Dá para apagar uma a uma com a tecla Delete.

### Passo 5 · O caminho do consentimento
1. Na primeira visita, a faixa "Salvar seu progresso neste aparelho?" aparece no rodapé.
2. Antes da resposta, nada é gravado.
3. **Salvar meu progresso:** grava `oc-consent = yes` e o progresso passa a ser salvo.
4. **Não salvar:** grava só `oc-consent = no`, para o aviso não voltar a cada visita. O progresso vale apenas enquanto a página estiver aberta.
5. **Apagar meu progresso** (menu Fases › Privacidade e progresso): apaga tudo e volta para "não salvar".

---

## Parte 2 · A LGPD aplicada ao jogo

### Passo 6 · O que é a LGPD
A Lei Geral de Proteção de Dados (Lei nº 13.709/2018) regula o uso de **dados pessoais** no Brasil. Ela vale para sites, apps e jogos, inclusive os gratuitos e os feitos por uma pessoa só, quando eles tratam dados de quem está no Brasil. A fiscalização é da **ANPD**, a Autoridade Nacional de Proteção de Dados.

### Passo 7 · Dado pessoal ou não?
Pelo art. 5º, I, dado pessoal é qualquer informação que identifica uma pessoa ou pode identificá-la. O progresso do jogo (`["phase2"]`) sozinho não identifica ninguém e não sai do aparelho, então provavelmente nem é dado pessoal.

Mesmo assim, pedir consentimento e explicar tudo é a postura mais segura e transparente. Também mostra cuidado para quem avaliar o seu portfólio.

### Passo 8 · Os papéis da lei e onde você entra
- **Titular:** a pessoa que joga.
- **Controladora:** quem decide por que e como os dados são usados. No Offshore Simulator, é você.
- **Encarregado (DPO):** a pessoa de contato com titulares e com a ANPD (art. 41). A Resolução CD/ANPD nº 2/2022 dispensa os agentes de pequeno porte, e pessoas físicas entram nessa categoria, de nomear um encarregado. Em troca, eles precisam oferecer um **canal de comunicação** com os titulares. O e-mail de contato no aviso cumpre esse papel.

### Passo 9 · Base legal
Toda forma de uso de dados precisa de uma base legal (art. 7º). O jogo usa o **consentimento** (art. 7º, I). Para valer, o consentimento precisa ser:
- **livre:** o jogo funciona igual se a pessoa recusar;
- **informado:** o aviso diz o que é salvo, para quê e onde;
- **inequívoco:** a pessoa clica num botão, nada vem marcado por padrão;
- **revogável a qualquer momento** (art. 8º, §5º): o botão "Apagar meu progresso" cumpre isso.

### Passo 10 · Direitos de quem joga (art. 18)
A pessoa pode pedir, entre outras coisas:
- a confirmação de que existem dados sobre ela e o acesso a eles;
- a correção ou a eliminação dos dados;
- informações sobre com quem os dados são compartilhados;
- a revogação do consentimento.

No jogo, quase tudo isso já está nas mãos da própria pessoa, porque os dados ficam no aparelho dela. Se alguém pedir por e-mail, a resposta costuma ser simples: você não tem acesso a nenhum dado, porque nada chega até você.

### Passo 11 · Dois pontos de atenção fora do jogo
1. **Fontes:** resolvido em 13/10/2026. As fontes agora ficam na pasta `fonts/` do próprio jogo (com as licenças OFL), e o aviso de privacidade tem a linha "Outros sites" explicando isso para quem joga. Ao publicar no GitHub, suba a pasta `fonts/` junto.
2. **Hospedagem:** no GitHub Pages, o GitHub registra os acessos (IP, navegador) nos servidores dele, como faz qualquer hospedagem. Vale citar isso no aviso, com um link para a política de privacidade do GitHub.

---

## Parte 3 · Como alguém entra em contato ou reclama

### Passo 12 · O caminho da pessoa
1. **Primeiro, com você:** a pessoa abre o aviso de privacidade e encontra a linha "Contato", com o seu e-mail. Ela escreve com a dúvida, o pedido ou a reclamação.
2. **Sua resposta:** pelo art. 19, a confirmação de existência ou o acesso aos dados deve ser respondido de forma simplificada na hora, ou de forma completa em até **15 dias**. O aviso promete resposta em até 15 dias.
3. **Se a pessoa não ficar satisfeita:** ela pode fazer uma petição à ANPD pelo gov.br (gov.br/anpd, na área de atendimento a titulares). A ANPD costuma pedir a comprovação de que a pessoa tentou resolver com a controladora antes.

### Passo 13 · Como responder um pedido
Modelo curto para um pedido de acesso ou exclusão:

> Olá! Obrigada pelo contato. O Offshore Simulator não envia nenhum dado para servidores: o progresso fica só no navegador de quem joga. Por isso, não tenho acesso a nenhuma informação sua. Para apagar tudo, abra o jogo, vá em Fases › Privacidade e progresso e clique em "Apagar meu progresso", ou limpe os dados do site no seu navegador. Fico à disposição.

### Passo 14 · Boas práticas para manter
- Guarde os e-mails recebidos e as respostas enviadas, para comprovar o atendimento.
- Se o jogo um dia passar a enviar dados para um servidor (ranking, login, estatísticas), o aviso e este guia precisam ser atualizados **antes** dessa mudança entrar no ar.

---

*Este guia é uma orientação técnica, não um parecer jurídico. Para uso comercial ou institucional, vale uma revisão com profissional de Direito Digital.*
