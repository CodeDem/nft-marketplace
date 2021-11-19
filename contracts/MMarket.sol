//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

// bring in openzeppelin ERC721 NFT functionality
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "hardhat/console.sol";

/**
    - Number of items minting
    - Number of transaction
    - Tokens that have not been sold
    - keep track of total number of items -  tokenId
    - Charge a lsiting fee so the owner makes a comission
 */
contract MMarket is ReentrancyGuard {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIds;
    Counters.Counter private _tokenSold;

    address payable owner;

    // listing comission price
    uint256 listingPrice = 0.045 ether;

    constructor() {
        // set the owner
        owner = payable(msg.sender);
    }

    struct MarketToken {
        uint256 itemId;
        address nftContract;
        uint256 tokenId;
        address payable seller;
        address payable owner;
        uint256 price;
        bool sold;
    }

    // tokenId return which MarketToken - fetch which on it is
    mapping(uint256 => MarketToken) private idToMarketToken;

    // listen to events from frontend
    event MarketTokenMinted(
        uint256 indexed itemId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        address owner,
        uint256 price,
        bool sold
    );

    // get listing price
    function getListingPrice() public view returns (uint256) {
        return listingPrice;
    }

    // two functions to interact with contract
    // 1. create a market item to put it up for sale
    // 2. crewate a market sale for buing and selling between parties

    function makeMarketItem(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) public payable nonReentrant {
        // nonReentract is a modifier to prevent reentry attack

        require(price > 0, "Price must be at at least one wei");
        require(
            msg.value == listingPrice,
            "Price must be equal to listing price"
        );
        _tokenIds.increment();
        uint256 itemId = _tokenIds.current();

        // putting it up for sale
        idToMarketToken[itemId] = MarketToken(
            itemId,
            nftContract,
            tokenId,
            payable(msg.sender),
            payable(address(0)),
            price,
            false
        );

        // NFT tranasction
        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);

        // emmit event of completion
        emit MarketTokenMinted(
            itemId,
            nftContract,
            tokenId,
            msg.sender,
            address(0),
            price,
            false
        );
    }

    // function to conduct tranasction and market sales
    function createMarketSale(address nftContract, uint256 itemId)
        public
        payable
        nonReentrant
    {
        MarketToken memory marketToken = idToMarketToken[itemId];
        uint256 price = marketToken.price;
        uint256 tokenId = marketToken.tokenId;
        require(
            msg.value == price,
            "Please submit the asking price in order to continue"
        );

        // transfer the amount to the seller;
        marketToken.seller.transfer(msg.value);

        // transfer the NFT token from contract address to the buyer
        IERC721(nftContract).transferFrom(address(this), msg.sender, tokenId);
        idToMarketToken[itemId].owner = payable(msg.sender);
        idToMarketToken[itemId].sold = true;
        _tokenSold.increment();

        payable(owner).transfer(listingPrice);
    }

    // function to fetchmarketItems - minting, buying and selling
    function fetchMarketTokens() public view returns (MarketToken[] memory) {
        uint256 itemsCount = _tokenIds.current();
        uint256 unsoldItemsCount = _tokenIds.current() - _tokenSold.current();
        uint256 currentIndex = 0;

        // looping over the number of items created (if number has not been sold populate the array)
        MarketToken[] memory items = new MarketToken[](unsoldItemsCount);
        for (uint256 i = 0; i < itemsCount; i++) {
            if (idToMarketToken[i + 1].owner == address(0)) {
                uint256 currentId = i + 1;
                MarketToken storage currentItem = idToMarketToken[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }

    // return purchased NFTs

    function fetchMyNFTs() public view returns (MarketToken[] memory) {
        uint256 totalItemCount = _tokenIds.current();
        uint256 itemCount = 0;
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < totalItemCount; i++) {
            if (idToMarketToken[i + 1].owner == msg.sender) {
                itemCount += 1;
            }
        }

        // second loop to loop through the amount you have purchased with itemCount
        // check to see if the owner address is equal to msg.sender
        MarketToken[] memory items = new MarketToken[](itemCount);
        for (uint256 i = 0; i < totalItemCount; i++) {
            if (idToMarketToken[i + 1].owner == msg.sender) {
                uint256 currentId = idToMarketToken[i + 1].itemId;
                // current array
                MarketToken storage currentItem = idToMarketToken[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }

    // returns array of minted NFTs
    function fetchItemsCreated() public view returns (MarketToken[] memory) {
        //  instead of .owner it will be the .seller
        uint256 totalItemCount = _tokenIds.current();
        uint256 itemCount = 0;
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < totalItemCount; i++) {
            if (idToMarketToken[i + 1].seller == msg.sender) {
                itemCount += 1;
            }
        }

        // second loop to loop through the amount you have purchased with itemCount
        // check to see if the owner address is equal to msg.sender
        MarketToken[] memory items = new MarketToken[](itemCount);
        for (uint256 i = 0; i < totalItemCount; i++) {
            if (idToMarketToken[i + 1].seller == msg.sender) {
                uint256 currentId = idToMarketToken[i + 1].itemId;
                MarketToken storage currentItem = idToMarketToken[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }
}
