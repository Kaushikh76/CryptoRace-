import React, { useState, useEffect } from 'react';

const CryptoPriceTracker = () => {
  const [cryptoData, setCryptoData] = useState([]);
  const [selectedCrypto, setSelectedCrypto] = useState('bitcoin');
  const [price, setPrice] = useState(null);

  useEffect(() => {
    const fetchCryptoList = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false');
        const data = await response.json();
        setCryptoData(data);
      } catch (error) {
        console.error('Error fetching crypto list:', error);
      }
    };

    fetchCryptoList();
  }, []);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${selectedCrypto}&vs_currencies=usd`);
        const data = await response.json();
        setPrice(data[selectedCrypto].usd);
      } catch (error) {
        console.error('Error fetching price:', error);
      }
    };

    if (selectedCrypto) {
      fetchPrice();
      const interval = setInterval(fetchPrice, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [selectedCrypto]);

  const handleCryptoChange = (event) => {
    setSelectedCrypto(event.target.value);
  };

  return (
    <div className="p-4 bg-white rounded shadow-md max-w-md mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-4">Crypto Price Tracker</h2>
      <div className="mb-4">
        <select
          value={selectedCrypto}
          onChange={handleCryptoChange}
          className="w-full p-2 border rounded"
        >
          {cryptoData.map((crypto) => (
            <option key={crypto.id} value={crypto.id}>
              {crypto.name}
            </option>
          ))}
        </select>
      </div>
      {price !== null && (
        <div className="text-2xl font-bold">
          Price: ${price.toFixed(2)} USD
        </div>
      )}
    </div>
  );
};

export default CryptoPriceTracker;