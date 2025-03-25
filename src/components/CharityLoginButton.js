import React from 'react';

const CharityLoginButton = ({ onLoginSuccess }) => {
	return (
		<button
			onClick={() => onLoginSuccess()}
			className='btn btn-active btn-secondary'
		>
			Login as Charity
		</button>
	);
};

export default CharityLoginButton;
