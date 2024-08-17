// src/services/roomService.js

const STORAGE_KEY = 'crypto_race_rooms';

const getRooms = () => {
  const rooms = localStorage.getItem(STORAGE_KEY);
  return rooms ? JSON.parse(rooms) : {};
};

const saveRooms = (rooms) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
};

export const createRoom = (roomCode, playerName, selectedCrypto) => {
  const rooms = getRooms();
  rooms[roomCode] = { 
    players: [{ name: playerName, prediction: null }],
    selectedCrypto: selectedCrypto,
    started: false,
    winner: null,
    startTime: null,
    priceData: []
  };
  saveRooms(rooms);
};

export const joinRoom = (roomCode, playerName) => {
  const rooms = getRooms();
  if (rooms[roomCode] && !rooms[roomCode].started) {
    rooms[roomCode].players.push({ name: playerName, prediction: null });
    saveRooms(rooms);
    return true;
  }
  return false;
};

export const getRoomPlayers = (roomCode) => {
  const rooms = getRooms();
  return rooms[roomCode] ? rooms[roomCode].players : null;
};

export const getRoomData = (roomCode) => {
  const rooms = getRooms();
  return rooms[roomCode] || null;
};

export const updatePlayerPrediction = (roomCode, playerName, prediction) => {
  const rooms = getRooms();
  if (rooms[roomCode]) {
    const playerIndex = rooms[roomCode].players.findIndex(p => p.name === playerName);
    if (playerIndex !== -1) {
      rooms[roomCode].players[playerIndex].prediction = prediction;
      saveRooms(rooms);
      return true;
    }
  }
  return false;
};

export const startRace = (roomCode, startTime, initialPriceData) => {
  const rooms = getRooms();
  if (rooms[roomCode]) {
    rooms[roomCode].started = true;
    rooms[roomCode].startTime = startTime.toISOString();
    rooms[roomCode].priceData = initialPriceData;
    saveRooms(rooms);
    return true;
  }
  return false;
};

export const updateRaceData = (roomCode, priceData) => {
  const rooms = getRooms();
  if (rooms[roomCode]) {
    rooms[roomCode].priceData = priceData;
    saveRooms(rooms);
    return true;
  }
  return false;
};

export const updateWinner = (roomCode, winnerName) => {
  const rooms = getRooms();
  if (rooms[roomCode]) {
    rooms[roomCode].winner = winnerName;
    saveRooms(rooms);
    return true;
  }
  return false;
};

export const fetchCryptocurrencies = async () => {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false');
    const data = await response.json();
    return data.map(crypto => ({
      id: crypto.id,
      name: crypto.name,
      symbol: crypto.symbol,
      image: crypto.image,
    }));
  } catch (error) {
    console.error('Error fetching cryptocurrencies:', error);
    return [];
  }
};