const Table = () => {
	return (
		<div class="overflow-x-auto rounded-box border border-base-content/5 bg-purple-950/20">
			<table class="table">
				<thead>
					<tr>
						<th></th>
						<th>Name</th>
						<th>Job</th>
						<th>Favorite Color</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<th>1</th>
						<td>Cy Ganderton</td>
						<td>Quality Control Specialist</td>
						<td>Blue</td>
					</tr>
					<tr>
						<th>2</th>
						<td>Hart Hagerty</td>
						<td>Desktop Support Technician</td>
						<td>Purple</td>
					</tr>
					<tr>
						<th>3</th>
						<td>Brice Swyre</td>
						<td>Tax Accountant</td>
						<td>Red</td>
					</tr>
				</tbody>
			</table>
		</div>
	);
}

export default Table;
