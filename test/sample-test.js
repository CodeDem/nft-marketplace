const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MMarket", function () {
  it("Should mint and trade NFTs", async function () {
    // test to receive contract addresses
    const Market = await ethers.getContractFactory("MMarket");
    const market = await Market.deploy();
    const marketAddress = market.address;

    const NFT = await ethers.getContractFactory("NFT");
    const nft = await NFT.deploy(marketAddress);
    await nft.deployed();
    const nftContractAddress = nft.address;

    // test to receive listing price and auction price
    let listingPrice = await market.getListingPrice();
    listingPrice = listingPrice.toString();

    const auctionPrice = ethers.utils.parseUnits("100", "ether");

    // test for minting
    await nft.mintToken("https-t1");
    await nft.mintToken("https-t2");

    await market.makeMarketItem(nftContractAddress, 1, auctionPrice, {
      value: listingPrice,
    });
    await market.makeMarketItem(nftContractAddress, 2, auctionPrice, {
      value: listingPrice,
    });

    // test for different addresses from different users - test accounts
    // return an array of however many addresses
    const [_, buyerAddress] = await ethers.getSigners();

    // create a market sale with address, id and price
    await market.connect(buyerAddress).createMarketSale(nftContractAddress, 1, {
      value: auctionPrice,
    });

    let items = await market.fetchMarketTokens();
    items = await Promise.all(
      items.map(async (item) => {
        // get uri of the value
        const tokenUri = await nft.tokenURI(item.tokenId);
        let result = {
          price: item.price.toString(),
          tokenId: item.tokenId.toString(),
          seller: item.seller.toString(),
          owner: item.owner.toString(),
          tokenUri,
        };
        return result;
      })
    );
    // test out all the items
    console.log("items", items);
  });
});
