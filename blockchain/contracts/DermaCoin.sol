// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DermaCoin
 * @dev Implementation of the DermaCoin ERC20 token for Charity Platform
 */
contract DermaCoin is ERC20, Ownable {
    constructor(address initialOwner) ERC20("DermaCoin", "DMC") Ownable(initialOwner) {
        // Mint some initial supply to the contract deployer
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }
    
    /**
     * @dev Override the decimals function to return 2 instead of the default 18
     */
    function decimals() public pure override returns (uint8) {
        return 2;
    }
    
    /**
     * @dev Function to mint more tokens (for testing purposes)
     * @param to The address that will receive the minted tokens
     * @param amount The amount of tokens to mint
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}