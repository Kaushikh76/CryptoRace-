import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import * as roomService from '../services/roomService';

const CryptoRaceLobby = ({ onJoinRoom }) => {
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [selectedCrypto, setSelectedCrypto] = useState('');
  const [cryptoList, setCryptoList] = useState([]);
  const [error, setError] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCryptos = async () => {
      setIsLoading(true);
      try {
        const fetchedCryptos = await roomService.fetchCryptocurrencies();
        setCryptoList(fetchedCryptos);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching cryptocurrencies:', error);
        setError('Failed to load cryptocurrency list. Please try again.');
        setIsLoading(false);
      }
    };
    fetchCryptos();
  }, []);

  const createRoom = () => {
    if (playerName.trim() === '' || selectedCrypto === '') {
      setError('Please enter your name and select a cryptocurrency');
      return;
    }
    const newRoomCode = uuidv4().substr(0, 6).toUpperCase();
    const selectedCryptoObject = cryptoList.find(crypto => crypto.id === selectedCrypto);
    roomService.createRoom(newRoomCode, playerName, selectedCryptoObject);
    onJoinRoom(newRoomCode, playerName, true);
  };

  const joinRoom = () => {
    if (playerName.trim() === '' || roomCode.trim() === '') {
      setError('Please enter your name and room code');
      return;
    }
    const success = roomService.joinRoom(roomCode.toUpperCase(), playerName);
    if (success) {
      onJoinRoom(roomCode.toUpperCase(), playerName, false);
    } else {
      setError('Unable to join room. It might not exist or the race has already started.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-cyan-300">
      <div className="p-8 bg-gray-800 rounded-lg shadow-xl max-w-md w-full border border-cyan-500">
        <h2 className="text-3xl font-bold mb-6 text-center text-cyan-400 animate-pulse">Crypto Race 2077</h2>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Your NetRunner Handle"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full p-2 border rounded bg-gray-700 text-cyan-300 border-cyan-500 placeholder-cyan-600 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          {isCreatingRoom ? (
            <select
              value={selectedCrypto}
              onChange={(e) => setSelectedCrypto(e.target.value)}
              className="w-full p-2 border rounded bg-gray-700 text-cyan-300 border-cyan-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
              disabled={isLoading}
            >
              <option value="">Select race cryptocurrency</option>
              {cryptoList.map((crypto) => (
                <option key={crypto.id} value={crypto.id}>
                  {crypto.name} ({crypto.symbol.toUpperCase()})
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              placeholder="Room Code (for joining)"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              className="w-full p-2 border rounded bg-gray-700 text-cyan-300 border-cyan-500 placeholder-cyan-600 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          )}
          <div className="flex space-x-4">
            <button
              onClick={() => {
                setIsCreatingRoom(true);
                if (isCreatingRoom && selectedCrypto) createRoom();
              }}
              className="flex-1 px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700 transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 shadow-lg shadow-pink-500/50"
              disabled={isLoading}
            >
              {isCreatingRoom ? 'Create Room' : 'Host Race'}
            </button>
            {!isCreatingRoom && (
              <button
                onClick={joinRoom}
                className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 shadow-lg shadow-cyan-500/50"
              >
                Join Race
              </button>
            )}
          </div>
          {error && (
            <p className="text-red-500 text-center bg-gray-700 p-2 rounded animate-pulse">
              {error}
            </p>
          )}
          {isLoading && (
            <p className="text-yellow-400 text-center">Loading cryptocurrencies...</p>
          )}
        </div>
        <div className="mt-8 text-sm text-center text-gray-400">
          <p>Enter the neon-lit world of Crypto Race 2077.</p>
          <p>Create a room to host your own race, or join an existing one with a room code.</p>
        </div>
      </div>
    </div>
  );
};

export default CryptoRaceLobby;