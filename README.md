# 💱 Currency Transfer Optimizer

A simple web app to compare direct vs intermediate currency transfers and find the better option.

## The Problem

When transferring money internationally, you often have a choice:
1. **Direct transfer**: Convert directly from source to target currency
2. **Intermediate transfer**: Convert to an intermediate currency first (e.g., USD), then to target

Depending on exchange rates, one option may give you more money than the other. This tool helps you compare both options instantly.

## Demo

Open `index.html` in your browser — no server required!

Or try it live: [GitHub Pages link after you enable it]

## Features

- 🌍 Support for 30+ currencies
- 📊 Real-time exchange rates via [exchangerate-api.com](https://exchangerate-api.com)
- 🏆 Clear winner indication with percentage difference
- 📱 Mobile-friendly responsive design
- 🚀 Zero dependencies, pure HTML/CSS/JS

## Usage

1. Select your **source** currency (what you have)
2. Select an **intermediate** currency (e.g., USD, EUR)
3. Select your **target** currency (what you want)
4. Enter the amount
5. Click "Compare Transfer Options"

## Example

Transferring ¥15,000,000 from Japan to India:
- **Option 1**: JPY → INR (direct)
- **Option 2**: JPY → USD → INR

The tool shows which path gives you more INR.

## Important Notes

⚠️ This tool uses **mid-market rates** for comparison. Actual bank rates include:
- Exchange rate spreads/margins
- Transfer fees
- Intermediary bank fees

Use this as a **directional guide** to decide which currency to send, then check your bank's actual rates.

## Development

### Running Tests

```bash
npm install
npm test
```

### Project Structure

```
├── index.html      # Main HTML file
├── app.js          # Application logic
├── app.test.js     # Unit tests
├── package.json    # Node.js config (for tests)
└── README.md
```

## API

This project uses the free [Exchange Rate API](https://www.exchangerate-api.com/) which:
- Requires no API key
- Updates rates daily
- Has generous rate limits

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file.

## Name

"Okane Kaeru" (お金カエル) is a triple pun in Japanese:
- お金 (okane) = money
- 帰る (kaeru) = to return home — *sending money back*
- 換える (kaeru) = to exchange — *currency conversion*
- 蛙 (kaeru) = frog 🐸 — *a traditional Japanese lucky charm*

In Japan, people carry frog charms (かえる守り) in their wallets because "okane ga kaeru" can mean both "money returns" and "money is a frog." It's considered good luck for wealth.

This app embodies all three: helping your money return home, through the best exchange rate, with a little luck on your side.
