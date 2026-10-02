# Velque

**Nasdaq closes. Velque opens.**

The order book for tokenized stocks on Solana.

Nasdaq prices a stock for 32.5 hours a week. Tokenized stocks trade all 168. For the other 135 hours there is no exchange price to check a trade against, and every order walks a thin pool alone. Velque changes how trading works in those hours instead of inventing a price for them.

| Session | When | How it trades |
| --- | --- | --- |
| Day | Nasdaq is open | A continuous book, price then time, inside a band around the Nasdaq price |
| Dark | Nights, weekends, holidays | Orders collect in short windows and clear together at one price |
| Opening cross | The moment Nasdaq is back | Everything that waited clears at once, then the Day book takes over |

