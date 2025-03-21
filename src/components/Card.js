const Card = () => {
	return (
		<div class="card bg-purple-950/40 w-1/4 shadow-sm rounded-3xl">
			<figure>
				<img
					src="https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.webp"
					alt="Shoes" />
			</figure>
			<div class="card-body">
				<h2 class="card-title">Card Title</h2>
				<p>A card component has a figure, a body part, and inside body there are title and actions parts</p>
				<div class="card-actions justify-end">
					<button class="btn btn-primary">Buy Now</button>
				</div>
			</div>
		</div>
	);
}

export default Card;
