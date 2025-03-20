import WorldcoinLogin from './WorldCoinLogin';
import { Ripple } from './magicui/ripple';

const LandingPage = () => {
	// console.log(btoa(process.env.NEXT_PUBLIC_WORLDCOIN_CLIENT_ID))
	// console.log(btoa(process.env.WORLDCOIN_CLIENT_SECRET))
	return (
		<div className="relative min-h-screen w-full bg-background overflow-hidden">
			<div className="absolute inset-0 flex items-center justify-center">
				<Ripple
					size={80}
					duration={4}
					className="bg-orange-700 bg-violet-950"
				/>
			</div>
			<div className="relative z-10 hero min-h-screen">
				<div className="hero-content text-neutral-content text-center">
					<div className="max-w-md">
						<h1 className="mb-5 text-5xl font-bold">DermaDAO</h1>
						<p className="mb-5">
							Decentralized charity funding platform that leverages quadratic funding to ensure fair and impactful donations.
						</p>
						<WorldcoinLogin />
					</div>
				</div>
			</div>
		</div>
	);
}

export default LandingPage;

