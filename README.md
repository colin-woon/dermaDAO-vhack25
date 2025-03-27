# DermaDAO - Decentralized Dermatology Research Funding Platform

DermaDAO is a decentralized autonomous organization (DAO) focused on funding dermatology research projects through quadratic funding. The platform enables donors to contribute to research initiatives while ensuring fair and transparent fund distribution.

## Features

- **Quadratic Funding**: Implements a quadratic funding mechanism to maximize the impact of individual donations
- **Smart Contract Integration**: Built on Scroll Sepolia testnet using Solidity smart contracts
- **Project Management**: Allows charities to create and manage research projects
- **Transparent Donations**: All donations and fund distributions are recorded on the blockchain
- **Proposal System**: Enables charities to submit funding proposals for approved projects
- **Real-time Tracking**: Monitor project progress and fund allocation in real-time

## Tech Stack

### Frontend
- Next.js
- React
- Tailwind CSS
- DaisyUI
- Ethers.js

### Backend
- Next.js API Routes
- PostgreSQL
- JWT Authentication

### Blockchain
- Solidity
- Scroll Sepolia Testnet
- OpenZeppelin Contracts

## Smart Contracts

The project uses two main smart contracts:

1. **DermaCoin (ERC20)**: The platform's native token used for donations and fund distribution
2. **CharityPlatform**: The main contract managing:
   - Project creation and management
   - Donation handling
   - Quadratic funding distribution
   - Proposal submission and approval
   - Fund claiming

## Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/yourusername/dermaDAO.git
cd dermaDAO
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file with the following variables:
```env
NEXT_PUBLIC_DERMACOIN_ADDRESS=your_dermacoin_contract_address
NEXT_PUBLIC_CHARITY_PLATFORM_ADDRESS=your_charity_platform_contract_address
NEXT_PUBLIC_SCROLL_SEPOLIA_RPC_URL=your_scroll_sepolia_rpc_url
JWT_SECRET=your_jwt_secret
DATABASE_URL=your_postgresql_connection_string
```

4. Set up the database:
```bash
# Run database migrations
npm run migrate
```

5. Start the development server:
```bash
npm run dev
```

## Smart Contract Deployment

1. Deploy DermaCoin:
```bash
npx hardhat run scripts/deploy-dermacoin.js --network scrollSepolia
```

2. Deploy CharityPlatform:
```bash
npx hardhat run scripts/deploy-charity-platform.js --network scrollSepolia
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- OpenZeppelin for their smart contract libraries
- Scroll Network for providing the testnet
- The quadratic funding community for their research and insights
