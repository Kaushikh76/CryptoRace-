import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as roomService from '../services/roomService';
import LoadingScreen from './LoadingScreen';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const RACE_DURATION = 60000; // 60 seconds
const UPDATE_INTERVAL = 1000; // 1 second

const LivePriceDisplay = ({ crypto }) => {
  const [livePrice, setLivePrice] = useState(null);

  useEffect(() => {
    const fetchLivePrice = async () => {
      try {
        const response = await fetch(`https://min-api.cryptocompare.com/data/price?fsym=${crypto.symbol}&tsyms=USD`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setLivePrice(data.USD);
      } catch (error) {
        console.error('Error fetching live price:', error);
      }
    };

    fetchLivePrice();
    const interval = setInterval(fetchLivePrice, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [crypto]);

  return (
    <div className="text-xl font-bold text-yellow-400 mb-4">
      {livePrice ? `Live Price: $${livePrice.toFixed(2)}` : 'Fetching live price...'}
    </div>
  );
};

const CryptoChickenRace = ({ roomCode, playerName, isHost }) => {
  const [crypto, setCrypto] = useState(null);
  const [players, setPlayers] = useState([]);
  const [raceStarted, setRaceStarted] = useState(false);
  const [winner, setWinner] = useState(null);
  const [winnerInfo, setWinnerInfo] = useState({ name: null, prediction: null, finalPrice: null });  const [timeLeft, setTimeLeft] = useState(RACE_DURATION / 1000);
  const [isLoading, setIsLoading] = useState(true);
  const [prediction, setPrediction] = useState('');
  const [initialPrice, setInitialPrice] = useState(null);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [finalPrice, setFinalPrice] = useState(null);
  const [error, setError] = useState(null);
  const [priceData, setPriceData] = useState([]);
  const [startTimestamp, setStartTimestamp] = useState(null);
  const [endTimestamp, setEndTimestamp] = useState(null);
  const chartRef = useRef(null);

  const fetchRoomData = useCallback(async () => {
    try {
      const roomData = await roomService.getRoomData(roomCode);
      if (roomData && roomData.selectedCrypto) {
        setCrypto(roomData.selectedCrypto);
        setPlayers(roomData.players || []);
        setRaceStarted(roomData.started);
        setWinner(roomData.winner);
        if (roomData.priceData && roomData.priceData.length > 0) {
          setPriceData(roomData.priceData);
          setInitialPrice(roomData.priceData[0].price);
          setCurrentPrice(roomData.priceData[roomData.priceData.length - 1].price);
          
          if (!roomData.started) {  // If the race has ended
            setFinalPrice(roomData.priceData[roomData.priceData.length - 1].price);
            setEndTimestamp(new Date(roomData.priceData[roomData.priceData.length - 1].timestamp));
          }
        }
        if (roomData.started) {
          const elapsedTime = Math.floor((Date.now() - new Date(roomData.startTime).getTime()) / 1000);
          setTimeLeft(Math.max(0, RACE_DURATION / 1000 - elapsedTime));
          setStartTimestamp(new Date(roomData.startTime));
        }
      } else {
        setError('Failed to load room data. The room might not exist or no cryptocurrency was selected.');
      }
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching room data:', err);
      setError('An error occurred while loading the room data.');
      setIsLoading(false);
    }
  }, [roomCode]);

  useEffect(() => {
    fetchRoomData();
    // Only update room data every 5 seconds to reduce unnecessary updates
    const interval = setInterval(fetchRoomData, 5000);
    return () => clearInterval(interval);
  }, [fetchRoomData]);

  useEffect(() => {
    let interval;
    if (raceStarted && timeLeft > 0) {
      interval = setInterval(async () => {
        try {
          const currentPriceData = await fetchCurrentPrice();
          if (currentPriceData !== null) {
            setTimeLeft((prevTime) => {
              if (prevTime <= 1) {
                clearInterval(interval);
                endRace();
                return 0;
              }
              return prevTime - 1;
            });
  
            setCurrentPrice(currentPriceData.price);
            setPriceData(prevData => {
              const newData = [...prevData, currentPriceData];
              if (isHost) {
                roomService.updateRaceData(roomCode, newData);
              }
              return newData;
            });
          }
        } catch (error) {
          console.error('Error updating price:', error);
          setError('Failed to update the current price.');
        }
      }, 1000);  // Update every second
    }
  
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [raceStarted, timeLeft, roomCode, isHost, crypto]);

  const startRace = async () => {
    setRaceStarted(true);
    setWinner(null);
    setTimeLeft(RACE_DURATION / 1000);
    setPriceData([]);
    const startTime = new Date();
    setStartTimestamp(startTime);
    try {
      const initialPriceData = await fetchCurrentPrice();
      if (initialPriceData !== null) {
        setInitialPrice(initialPriceData.price);
        setCurrentPrice(initialPriceData.price);
        setPriceData([initialPriceData]);
        roomService.startRace(roomCode, startTime, [initialPriceData]);
      }
    } catch (error) {
      console.error('Error starting race:', error);
      setError('Failed to start the race. Please try again.');
      setRaceStarted(false);
    }
  };

  const fetchCurrentPrice = async () => {
    if (!crypto || !crypto.symbol) {
      throw new Error('No cryptocurrency selected for this race.');
    }
    const response = await fetch(`https://min-api.cryptocompare.com/data/price?fsym=${crypto.symbol}&tsyms=USD`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const price = data.USD;
    if (price === undefined) {
      throw new Error('Price data not available');
    }
    const timestamp = new Date();
    
    console.log(`Fetched price for ${crypto.symbol}: $${price} at ${timestamp.toISOString()}`);
    
    return {
      time: (RACE_DURATION / 1000) - timeLeft,
      price: price,
      timestamp: timestamp.toISOString(),
    };
  };

  const endRace = async () => {
    console.log("Ending race...");
    setRaceStarted(false);
    try {
      const finalPriceData = await fetchCurrentPrice();
      const endTimestamp = new Date(finalPriceData.timestamp);
      const finalPrice = finalPriceData.price;
  
      console.log("Final price:", finalPrice, "End time:", endTimestamp);
  
      setEndTimestamp(endTimestamp);
      setFinalPrice(finalPrice);
      setCurrentPrice(finalPrice);
  
      setPriceData(prevData => {
        const newData = [...prevData, finalPriceData];
        if (isHost) {
          roomService.updateRaceData(roomCode, newData);
        }
        return newData;
      });
  
      console.log("Players:", players);
  
      const winningPlayer = players.reduce((closest, player) => {
        if (player.prediction === null) return closest;
        const currentDiff = Math.abs(player.prediction - finalPrice);
        const closestDiff = Math.abs(closest.prediction - finalPrice);
        return currentDiff < closestDiff ? player : closest;
      }, { name: 'No winner', prediction: Infinity });
  
      console.log("Winning player:", winningPlayer);
  
      setWinner(winningPlayer);
      setWinnerInfo({
        name: winningPlayer.name,
        prediction: winningPlayer.prediction,
        finalPrice: finalPrice
      });
  
      if (isHost) {
        roomService.updateWinner(roomCode, winningPlayer.name, winningPlayer.prediction, finalPrice);
      }
  
      console.log("Race ended. Final price:", finalPrice, "End time:", endTimestamp, "Winner:", winningPlayer.name);
  
    } catch (error) {
      console.error('Error ending race:', error);
      setError('Failed to end the race properly.');
    }
  };

  const submitPrediction = () => {
    if (prediction && !isNaN(prediction)) {
      const updatedPrediction = parseFloat(prediction);
      roomService.updatePlayerPrediction(roomCode, playerName, updatedPrediction);
      setPlayers(prevPlayers => 
        prevPlayers.map(player => 
          player.name === playerName ? { ...player, prediction: updatedPrediction } : player
        )
      );
      setPrediction('');
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-red-500">
        <div className="p-8 bg-gray-800 rounded-lg shadow-xl max-w-md w-full border border-red-500">
          <h2 className="text-2xl font-bold mb-4">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-cyan-300">
      <div className="p-8 bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full border border-cyan-500">
        <h2 className="text-4xl font-bold mb-6 text-center text-cyan-400 animate-pulse">Crypto Race 2077</h2>
        <div className="mb-4 text-center">Room Code: <span className="font-bold text-pink-500">{roomCode}</span></div>
        <div className="mb-6 text-center">
          <h3 className="text-2xl font-bold text-yellow-400">
            {crypto && crypto.name ? 
              `${crypto.name} (${crypto.symbol ? crypto.symbol.toUpperCase() : 'N/A'})` : 
              'No cryptocurrency selected'}
          </h3>
          {!raceStarted && crypto && <LivePriceDisplay crypto={crypto} />}
          {initialPrice && <p className="text-lg">Starting Price: ${initialPrice.toFixed(2)}</p>}
          {currentPrice && <p className="text-lg">Current Price: ${currentPrice.toFixed(2)}</p>}
          {finalPrice && <p className="text-lg">Final Price: ${finalPrice.toFixed(2)}</p>}
          {startTimestamp && <p className="text-sm">Start Time: {startTimestamp.toLocaleString()}</p>}
          {endTimestamp && <p className="text-sm">End Time: {endTimestamp.toLocaleString()}</p>}
        </div>
        <div className="mb-6 flex justify-center">
          {isHost && !raceStarted && (
            <button 
              onClick={startRace} 
              className="px-6 py-3 bg-pink-600 text-white rounded-full hover:bg-pink-700 transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-110 shadow-lg shadow-pink-500/50"
            >
              Initiate Race
            </button>
          )}
          {raceStarted && <span className="text-2xl font-semibold text-yellow-400">Time left: {timeLeft}s</span>}
        </div>
        {!raceStarted && !winner && (
          <div className="mb-6 flex justify-center items-center space-x-4">
            <input
              type="number"
              step="0.01"
              placeholder="Your price prediction"
              value={prediction}
              onChange={(e) => setPrediction(e.target.value)}
              className="p-2 border rounded bg-gray-700 text-cyan-300 border-cyan-500 placeholder-cyan-600 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            <button
              onClick={submitPrediction}
              className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 transition duration-300 ease-in-out"
            >
              Submit Prediction
            </button>
          </div>
        )}
        <div className="mb-6 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={priceData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="time" 
                label={{ value: 'Time (s)', position: 'insideBottomRight', offset: -10 }} 
                domain={[0, 60]}
              />
              <YAxis 
                label={{ value: 'Price (USD)', angle: -90, position: 'insideLeft' }} 
                domain={['auto', 'auto']}
              />
              <Tooltip 
                labelFormatter={(value) => `Time: ${value}s`}
                formatter={(value, name, props) => [
                  `$${value.toFixed(2)}`, 
                  name, 
                  `Timestamp: ${new Date(props.payload.timestamp).toLocaleString()}`
                ]}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#8884d8" 
                dot={false} 
                strokeWidth={2}
                animationDuration={300}
              />
              {players.map((player, index) => (
                <Line
                  key={player.name}
                  type="monotone"
                  dataKey={() => player.prediction}
                  stroke={`hsl(${index * 137.5 % 360}, 70%, 50%)`}
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  name={`${player.name}'s Prediction`}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mb-6">
          <h3 className="text-xl font-bold mb-2 text-pink-400">Racers</h3>
          <div className="space-y-2">
            {players.map((player, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-700 p-2 rounded border border-pink-700">
                <span className="text-cyan-300">{player.name}</span>
                <span className="text-yellow-400">
                  {player.prediction ? `$${player.prediction.toFixed(2)}` : 'No prediction yet'}
                </span>
                {winner && player.name === winner.name && <span className="ml-2 text-2xl">🏆</span>}
              </div>
            ))}
          </div>
        </div>
        {winner && (
    <div className="text-2xl font-bold text-center bg-yellow-600 text-black p-4 rounded-lg animate-pulse">
      {winner.name && winner.name !== 'No winner' ? (
        <>Winner: {winner.name} 🏆</>
      ) : winner.name === 'No winner' ? (
        <>No winner this time!</>
      ) : (
        <>Winner determined, but name is missing 🏆</>
      )}
    </div>
  )}
  {!winner && (
    <div className="text-2xl font-bold text-center bg-gray-600 text-white p-4 rounded-lg">
      Waiting for race to end...
    </div>
  )}
      </div>
    </div>
  );
};

export default CryptoChickenRace;