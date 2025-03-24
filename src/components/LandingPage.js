import WorldcoinLogin from './WorldCoinLogin';
import CharityLoginButton from './CharityLoginButton';
import { WarpBackground } from './magicui/warp-background';

const LandingPage = ({ onDonorAuthSuccess, onCharityAuthSuccess }) => {
	const handleCharityLoginSuccess = (userId) => {
		onCharityAuthSuccess(userId);
		console.log('Charity logged in with ID:', userId);
	};
	// console.log(btoa(process.env.NEXT_PUBLIC_WORLDCOIN_CLIENT_ID))
	// console.log(btoa(process.env.WORLDCOIN_CLIENT_SECRET))
	return (
		<div className="relative min-h-screen w-full bg-background overflow-hidden bg-gray-950">
			<div className="absolute inset-0 flex items-center justify-center">
				<WarpBackground
					className="w-full h-full border-none p-0"
					beamsPerSide={5}
					beamSize={5}
					beamDuration={6}
					gridColor="rgba(80, 5, 255, 0.3)" // violet color with opacity
				></WarpBackground>
			</div>
			<div className="relative z-10 hero min-h-screen">
				<div className="hero-content text-neutral-content text-center">
					<div className="max-w-md">
						<div className='flex flex-row'>
							<h1 className="-mr-7 mb-5 text-7xl font-bold flex items-center justify-center">
								DermaDAO
							</h1>
							<div className='p-2'></div>
							<img src="/dermaDAOlogo.png" alt="DermaDAO Logo" className="h-20 w-20" />
						</div>
						<p className="mb-5 text-1xl italic">
							Decentralized charity funding platform that leverages quadratic funding to ensure fair and impactful donations.
						</p>
						<div className='flex flex-col items-center justify-center space-y-4 padding'>
							<WorldcoinLogin onAuthSuccess={onDonorAuthSuccess} />
							<button className="btn btn-primary" onClick={onDonorAuthSuccess}>TEST: LOGIN AS DONOR</button>
							<CharityLoginButton onLoginSuccess={handleCharityLoginSuccess} />
							<button className="btn btn-secondary" onClick={() => handleCharityLoginSuccess(1)}>TEST: LOGIN AS CHARITY</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default LandingPage;

