<a href="https://usevelque.xyz"><img src="banner.jpg" alt="Velque: the order book for tokenized stocks on Solana" width="100%"></a>

<h3 align="center">Nasdaq closes. Velque opens.</h3>

<p align="center">The order book for tokenized stocks on Solana.</p>

<p align="center">
  <a href="https://usevelque.xyz"><img src="https://img.shields.io/badge/site-usevelque.xyz-2a1228?style=flat-square" alt="Site"></a>
  <a href="https://usevelque.xyz/docs"><img src="https://img.shields.io/badge/docs-read-2a1228?style=flat-square" alt="Docs"></a>
  <a href="https://x.com/usevelque"><img src="https://img.shields.io/badge/@usevelque-2a1228?style=flat-square&logo=x&logoColor=white" alt="X"></a>
  <a href="https://github.com/usevelque/velque-program"><img src="https://img.shields.io/badge/solana-devnet-f58aae?style=flat-square&labelColor=2a1228" alt="Solana devnet"></a>
</p>

<a href="https://github.com/usevelque/market-log">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/usevelque/usevelque/output/board-dark.svg">
    <img src="https://raw.githubusercontent.com/usevelque/usevelque/output/board-light.svg" alt="The Velque test market right now, read from Solana devnet" width="100%">
  </picture>
</a>

Nasdaq prices a stock for 32.5 hours a week. Tokenized stocks trade all 168. For the other 135 hours there is no exchange price to check a trade against, and every order walks a thin pool alone. Velque changes how trading works in those hours instead of inventing a price for them.

| Session | When | How it trades |
| --- | --- | --- |
| **Day** | Nasdaq is open | A continuous book, price then time, inside a band around the Nasdaq price |
| **Dark** | Nights, weekends, holidays | Orders collect in short windows and clear together at one price |
| **Opening cross** | The moment Nasdaq is back | Everything that waited clears at once, then the Day book takes over |

Every cleared auction stays on chain with its orders, so anyone can replay it and get the same price.

**[Read the docs](https://usevelque.xyz/docs)** · [Site](https://usevelque.xyz) · [X](https://x.com/usevelque)

### Repositories

| | |
| --- | --- |
| **[velque-program](https://github.com/usevelque/velque-program)** | The Solana program. Pinocchio, `no_std`, SPL Token and Token-2022 |
| **[velque-sdk](https://github.com/usevelque/velque-sdk)** | JavaScript client, the clearing rule in JS, the reference price |
| **[auction-replay](https://github.com/usevelque/auction-replay)** | Recompute any auction from the orders stored on chain |
| **[velque-keeper](https://github.com/usevelque/velque-keeper)** | The crank, the Nasdaq reference oracle, the test-market maker |
| **[velque-app](https://github.com/usevelque/velque-app)** | The web app |
| **[market-log](https://github.com/usevelque/market-log)** | Snapshots of the test market, with every stored auction replayed |

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/usevelque/usevelque/output/snake-dark.svg">
  <img src="https://raw.githubusercontent.com/usevelque/usevelque/output/snake-light.svg" alt="Contribution graph" width="100%">
</picture>

<sub>The test market runs all three sessions with three test stocks on Solana devnet. In development, not audited.</sub>
