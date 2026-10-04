# Velque

**Nasdaq closes. Velque opens.**

The order book for tokenized stocks on Solana.

Nasdaq prices a stock for 32.5 hours a week. Tokenized stocks trade all 168. For the other 135 hours there is no exchange price to check a trade against, and every order walks a thin pool alone. Velque changes how trading works in those hours instead of inventing a price for them.

| Session | When | How it trades |
| --- | --- | --- |
| Day | Nasdaq is open | A continuous book, price then time, inside a band around the Nasdaq price |
| Dark | Nights, weekends, holidays | Orders collect in short windows and clear together at one price |
| Opening cross | The moment Nasdaq is back | Everything that waited clears at once, then the Day book takes over |

## Repositories

| | |
| --- | --- |
| [velque-program](https://github.com/usevelque/velque-program) | The Solana program. Pinocchio, `no_std`, SPL Token and Token-2022 |
| [velque-sdk](https://github.com/usevelque/velque-sdk) | JavaScript client, the clearing rule in JS, the reference price |
| [auction-replay](https://github.com/usevelque/auction-replay) | Recompute any auction from the orders stored on chain |
| [velque-keeper](https://github.com/usevelque/velque-keeper) | The crank, the Nasdaq reference oracle, the test-market maker |
| [velque-app](https://github.com/usevelque/velque-app) | The web app |

