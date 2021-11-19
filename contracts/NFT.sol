//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

// bring in openzeppelin ERC721 NFT functionality
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract NFT is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    // counters allow us to keep track of tokenIds

    // address of marketplace for NFTs to interact
    address contractAddress;

    // OBJ: give the NFT market the ability to transact with tokens or change ownserhip
    // setApprovalForAll allows us to do that with contract address

    // constructor set up our address
    constructor(address marketplaceAddress) ERC721("Magicbox", "MGX") {
        contractAddress = marketplaceAddress;
    }

    function mintToken(string memory tokenURI) public returns (uint256) {
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        _mint(msg.sender, newItemId);
        _setTokenURI(newItemId, tokenURI);
        setApprovalForAll(contractAddress, true);
        // mint the token and set it for sale and return the new newItemId;
        return newItemId;
    }
}
