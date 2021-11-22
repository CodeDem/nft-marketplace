/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useState } from "react";
import DefaultLayout from "../../components/Layouts/DefaultLayout";
import { ethers } from "ethers";
import axios from "axios";
import Web3Modal from "web3modal";
import { nftAddress, nftMarketAddress } from "../../config";
import NFT from "../../artifacts/contracts/NFT.sol/NFT.json";
import MMarket from "../../artifacts/contracts/MMarket.sol/MMarket.json";

export default function MyNFTs() {
  //  array of NFTs
  const [nfts, setNFTs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadNFTs();
  }, []);

  const loadNFTs = async () => {
    // what we want to load:
    //  we want to get msg.sender hook up to the signer to display owner NFTs
    setIsLoading(true);

    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    const tokenContract = new ethers.Contract(nftAddress, NFT.abi, provider);
    const marketContract = new ethers.Contract(
      nftMarketAddress,
      MMarket.abi,
      signer
    );

    const data = await marketContract.fetchMyNFTs();

    const items = await Promise.all(
      data.map(async (item) => {
        const tokenUri = await tokenContract.tokenURI(item.tokenId);
        // we want to get the token metadata - JSON
        const meta = await axios.get(tokenUri);
        let price = ethers.utils.formatUnits(item.price.toString(), "ether");
        let token = {
          price,
          tokenId: item.tokenId.toString(),
          seller: item.seller.toString(),
          owner: item.owner.toString(),
          image: meta.data.image,
          name: meta.data.name,
          description: meta.data.description,
        };
        return token;
      })
    );
    setNFTs(items);
    setIsLoading(false);
  };

  return (
    <DefaultLayout title="My NFTs">
      {isLoading ? (
        <div className="flex justify-center items-center">
          <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-24 w-24"></div>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
          {nfts.map((nft) => (
            <div key={nft.tokenId} className="group relative">
              <div className="w-full min-h-40 bg-gray-200 p-2 aspect-w-1 aspect-h-1 rounded-md overflow-hidden group-hover:opacity-75 lg:h-80 lg:aspect-none">
                <img
                  src={nft.image}
                  alt={nft.name}
                  className="w-full h-full object-center object-contain lg:w-full lg:h-full"
                />
              </div>
              <div className="mt-4 flex flex-col justify-between">
                <p className="text-md font-bold">{nft.name}</p>
                <p className="text-sm ">{nft.description}</p>
                <p className="font-lg font-bold">{nft.price} MATIC</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </DefaultLayout>
  );
}
