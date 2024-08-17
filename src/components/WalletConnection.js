import React, { useState, useEffect } from 'react';
import Web3Modal from "web3modal";
import { BrowserProvider, JsonRpcProvider } from "ethers";
import WalletConnectProvider from "@walletconnect/web3-provider";

const networks = {
  mainnet: { 
    chainId: '0x1',
    chainName: 'Ethereum Mainnet',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://mainnet.infura.io/v3/YOUR_INFURA_ID'],
    blockExplorerUrls: ['https://etherscan.io/']
  },
  arbitrum: {
    chainId: '0xa4b1',
    chainName: 'Arbitrum One',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    blockExplorerUrls: ['https://arbiscan.io/']
  },
  linea: {
    chainId: '0xe708',
    chainName: 'Linea Mainnet',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://rpc.linea.build'],
    blockExplorerUrls: ['https://lineascan.build/']
  },
  // Add more networks as needed
};

const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider,
    options: {
      infuraId: "DY7wIf74UTtinAu5IgM6hFuNNmpYwPEYQuDrfG0dFF+niHwDM3n2Gw" // Replace with your Infura ID
    }
  }
};

const web3Modal = new Web3Modal({
  network: "mainnet", // Default network
  cacheProvider: true,
  providerOptions
});

const WalletConnection = ({ onConnect }) => {
  const [account, setAccount] = useState(null);
  const [network, setNetwork] = useState('mainnet');
  const [provider, setProvider] = useState(null);

  const connectWallet = async () => {
    try {
      const provider = await web3Modal.connect();
      const library = new BrowserProvider(provider);
      const accounts = await library.listAccounts();
      const network = await library.getNetwork();
      if (accounts && accounts.length > 0) {
        const address = accounts[0].address || accounts[0];
        setAccount(address);
        setProvider(provider);
        onConnect(address, library);
      } else {
        console.error("No accounts found");
      }
    } catch (error) {
      console.error("Could not connect to wallet:", error);
    }
  };

  const disconnectWallet = async () => {
    await web3Modal.clearCachedProvider();
    setAccount(null);
    setProvider(null);
  };

  const switchNetwork = async (networkName) => {
    if (!provider) {
      console.error("Wallet not connected");
      return;
    }

    const networkConfig = networks[networkName];

    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: networkConfig.chainId }],
      });
      setNetwork(networkName);
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [networkConfig],
          });
          setNetwork(networkName);
        } catch (addError) {
          console.error("Failed to add network:", addError);
        }
      } else {
        console.error("Failed to switch network:", switchError);
      }
    }
  };

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      connectWallet();
    }
  }, []);

  const formatAddress = (address) => {
    if (typeof address === 'string' && address.length > 10) {
      return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    }
    return address;
  };

  return (
    <div className="mb-4">
      {account ? (
        <div className="flex items-center justify-between bg-gray-700 p-2 rounded border border-cyan-500">
          <span className="text-cyan-300">
            Connected: {formatAddress(account)}
          </span>
          <select
            value={network}
            onChange={(e) => switchNetwork(e.target.value)}
            className="mx-2 p-1 bg-gray-800 text-cyan-300 rounded border border-cyan-500"
          >
            {Object.keys(networks).map((networkName) => (
              <option key={networkName} value={networkName}>
                {networks[networkName].chainName}
              </option>
            ))}
          </select>
          <button onClick={disconnectWallet} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition duration-300 ease-in-out">
            Disconnect
          </button>
        </div>
      ) : (
        <button onClick={connectWallet} className="w-full px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 transition duration-300 ease-in-out">
          Connect Wallet
        </button>
      )}
    </div>
  );
};

export default WalletConnection;