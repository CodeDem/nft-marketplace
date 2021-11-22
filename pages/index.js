/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useState } from "react";
import DefaultLayout from "../components/Layouts/DefaultLayout";
import { ethers } from "ethers";
import axios from "axios";
import Web3Modal from "web3modal";
import { nftAddress, nftMarketAddress } from "../config";
import { toast } from "react-toastify";

import NFT from "../artifacts/contracts/NFT.sol/NFT.json";
import MMarket from "../artifacts/contracts/MMarket.sol/MMarket.json";

export default function Home() {
  const [nfts, setNFTs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    loadNFTs();
  }, []);

  const loadNFTs = async () => {
    // what we want to load:
    // provider, tokenContract, marketContract, data for marketItems
    setIsLoading(true);
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const tokenContract = new ethers.Contract(nftAddress, NFT.abi, provider);
    const marketContract = new ethers.Contract(
      nftMarketAddress,
      MMarket.abi,
      provider
    );

    const data = await marketContract.fetchMarketTokens();

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
    setNFTs(items.reverse());
    setIsLoading(false);
  };

  // function to buy NFT from market
  const buyNFT = async (nft) => {
    const toastId = toast.loading("Processing, please wait!");

    try {
      const web3Modal = new Web3Modal();
      const connection = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        nftMarketAddress,
        MMarket.abi,
        signer
      );
      const price = ethers.utils.parseUnits(nft.price.toString(), "ether");
      const transaction = await contract.createMarketSale(
        nftAddress,
        nft.tokenId,
        {
          value: price,
        }
      );
      await transaction.wait();
      toast.update(toastId, {
        type: toast.TYPE.SUCCESS,
        render: `Successfully purchased NFT`,
        isLoading: false,
        autoClose: 2000
      });
      loadNFTs();
    } catch (error) {
      console.log(error.message);
      toast.update(toastId, {
        type: toast.TYPE.ERROR,
        render: `${error.message}`,
        isLoading: false,
        autoClose: 2000,
      });
    }
  };

  return (
    <DefaultLayout title="NFTs for Sale!">
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
                <p className="text-sm line-clamp-1">{nft.description}</p>
                <p className="font-lg font-bold">{nft.price} MATIC</p>
                <button
                  type="button"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-md  font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={() => buyNFT(nft)}
                >
                  Buy
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DefaultLayout>
  );
}
