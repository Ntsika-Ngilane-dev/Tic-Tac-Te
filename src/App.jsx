import { useEffect, useReducer, useRef, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'react-hq-ttt-save-v1'

const DIFFICULTIES = [
  { id: 'easy', label: 'Easy' },
  { id: 'medium', label: 'Medium' },
  { id: 'hard', label: 'Hard' },
]

const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
]

const BACKGROUNDS = [
  { id: 'classic', name: 'Classic Console', price: 0, gradient: 'linear-gradient(135deg, #020817 0%, #111827 100%)' },
  { id: 'neon', name: 'Neon Dusk', price: 60, gradient: 'linear-gradient(135deg, #0f172a 0%, #4c1d95 50%, #0ea5e9 100%)' },
  { id: 'sunset', name: 'Sunset Grid', price: 90, gradient: 'linear-gradient(135deg, #431407 0%, #9a3b1b 35%, #f59e0b 100%)' },
  { id: 'forest', name: 'Forest Pulse', price: 120, gradient: 'linear-gradient(135deg, #052e16 0%, #166534 45%, #22c55e 100%)' },
]

const SHOP_ITEMS = [
  { id: 'focus-chip', name: 'Focus Chip', price: 35, description: 'Boosts your tactical AI confidence.', type: 'item' },
  { id: 'lucky-token', name: 'Lucky Token', price: 45, description: 'Adds a subtle edge to your run history.', type: 'item' },
  { id: 'mentor-badge', name: 'Mentor Badge', price: 75, description: 'A prestige item for career mode.', type: 'item' },
]

const EXTRA_SHOP_CATEGORIES = [
  ['Chrome', 'Polished hardware for a sharper board presence.', 40],
  ['Carbon', 'Lightweight tactical gear built for long sessions.', 50],
  ['Signal', 'Clean visual tools for reading the next move.', 60],
  ['Quantum', 'Experimental upgrades from the strategy lab.', 70],
  ['Velvet', 'Premium desk pieces for quiet confidence.', 80],
  ['Orbit', 'Accessories inspired by motion and momentum.', 90],
  ['Ember', 'Warm accents for players who thrive under pressure.', 100],
  ['Frost', 'Cool, precise equipment for patient players.', 110],
  ['Cobalt', 'Reliable blueprints for disciplined runs.', 120],
  ['Prism', 'Colorful collectibles from the arcade archives.', 130],
  ['Atlas', 'Heavy-duty tools for ambitious campaigns.', 140],
  ['Nova', 'Bright upgrades for players reaching a new level.', 150],
  ['Echo', 'Subtle equipment that rewards careful timing.', 160],
  ['Vector', 'Directional tools for decisive board control.', 170],
  ['Solstice', 'Limited seasonal goods from the premium shelf.', 180],
  ['Lumen', 'Soft-lit accessories for late-night matches.', 190],
  ['Monolith', 'Minimal statement pieces for the serious player.', 200],
  ['Pulse', 'Fast-response gear for high-energy rounds.', 210],
  ['Axiom', 'Foundational upgrades for the next generation.', 220],
  ['Zenith', 'Top-tier rewards reserved for the final climb.', 240],
]

const EXTRA_SHOP_ITEMS = EXTRA_SHOP_CATEGORIES.flatMap(([category, description, basePrice], categoryIndex) =>
  Array.from({ length: 10 }, (_, itemIndex) => ({
    id: `shop-${category.toLowerCase()}-${itemIndex + 1}`,
    name: `${category} ${['Token', 'Badge', 'Marker', 'Chip', 'Frame', 'Charm', 'Emblem', 'Module', 'Key', 'Relic'][itemIndex]}`,
    price: basePrice + itemIndex * 5,
    description: `${description} Edition ${itemIndex + 1} of 10.`,
    type: 'item',
    categoryIndex,
  })),
)

const SHOP_CATALOG = [...SHOP_ITEMS, ...EXTRA_SHOP_ITEMS]

const CAREER_MISSIONS = [
  {
    id: 'bootcamp',
    title: 'Bootcamp Trial',
    chapter: 'Chapter 1: First Move',
    story: 'Your manager hands you a training board and says, “Win one match and prove you belong in the office.”',
    narration: 'Welcome to the boardroom. Your first assignment is simple: make your mark, stay focused, and win one match.',
    objective: 'Win 1 match against the AI.',
    reward: 60,
    xp: 40,
    validate: (profile) => profile.stats.wins >= 1,
  },
  {
    id: 'draw-lesson',
    title: 'The Stalemate',
    chapter: 'Chapter 1: First Move',
    story: 'The team is divided by a tie. You learn that patience matters as much as aggression.',
    narration: 'The room is split down the middle. Find balance, read the board, and earn your first draw.',
    objective: 'Draw 1 match.',
    reward: 90,
    xp: 55,
    validate: (profile) => profile.stats.draws >= 1,
  },
  {
    id: 'comeback',
    title: 'Comeback Protocol',
    chapter: 'Chapter 2: Pressure Test',
    story: 'A rival pushes you into a losing streak. You must recover your nerve and take control.',
    narration: 'A rival has found your weakness. Do not retreat. Take the loss, learn from it, and return to the board.',
    objective: 'Lose 1 match and continue anyway.',
    reward: 110,
    xp: 65,
    validate: (profile) => profile.stats.losses >= 1,
  },
  {
    id: 'captain',
    title: 'Captain of the Board',
    chapter: 'Chapter 2: Pressure Test',
    story: 'The boardroom is silent as you face the final trial. One perfect streak decides your future.',
    narration: 'The boardroom is watching. Build a three match record and show them you can lead under pressure.',
    objective: 'Win 3 matches total.',
    reward: 180,
    xp: 95,
    validate: (profile) => profile.stats.wins >= 3,
  },
  {
    id: 'corner-office',
    title: 'Corner Office',
    chapter: 'Chapter 3: The Climb',
    story: 'You are given a new desk and a harder opponent. Every corner becomes a calculated opportunity.',
    narration: 'Your promotion comes with a new view and a sharper opponent. Claim the corners and win again.',
    objective: 'Win 4 matches total.',
    reward: 120,
    xp: 70,
    validate: (profile) => profile.stats.wins >= 4,
  },
  {
    id: 'quiet-reading',
    title: 'Quiet Reading',
    chapter: 'Chapter 3: The Climb',
    story: 'The loudest player at the table makes the first mistake. You learn to let the board speak.',
    narration: 'Silence is an advantage. Watch carefully, wait for the opening, and earn your fifth win.',
    objective: 'Win 5 matches total.',
    reward: 130,
    xp: 75,
    validate: (profile) => profile.stats.wins >= 5,
  },
  {
    id: 'crossroads',
    title: 'The Crossroads',
    chapter: 'Chapter 4: Hidden Lines',
    story: 'Two paths open at once. Only a player who can spot the hidden line will choose correctly.',
    narration: 'Two paths, one decision. See the line before it appears and prove your instincts.',
    objective: 'Win 6 matches total.',
    reward: 140,
    xp: 80,
    validate: (profile) => profile.stats.wins >= 6,
  },
  {
    id: 'mirror-match',
    title: 'Mirror Match',
    chapter: 'Chapter 4: Hidden Lines',
    story: 'Your opponent plays exactly like you. The only way through is to become more adaptable.',
    narration: 'Your opponent knows your habits because they share them. Break your pattern and win the mirror match.',
    objective: 'Win 7 matches total.',
    reward: 150,
    xp: 85,
    validate: (profile) => profile.stats.wins >= 7,
  },
  {
    id: 'night-shift',
    title: 'Night Shift',
    chapter: 'Chapter 5: After Hours',
    story: 'Long after the office empties, the final monitor stays lit. You sit down for one more round.',
    narration: 'The office is dark, but the board is still glowing. Keep your focus through the night shift.',
    objective: 'Win 8 matches total.',
    reward: 160,
    xp: 90,
    validate: (profile) => profile.stats.wins >= 8,
  },
  {
    id: 'the-audit',
    title: 'The Audit',
    chapter: 'Chapter 5: After Hours',
    story: 'An auditor reviews every move you have made. Consistency matters more than one lucky victory.',
    narration: 'Every move is being reviewed. Build a record that no auditor can dismiss.',
    objective: 'Win 9 matches total.',
    reward: 170,
    xp: 95,
    validate: (profile) => profile.stats.wins >= 9,
  },
  {
    id: 'deadlock',
    title: 'Deadlock',
    chapter: 'Chapter 6: No Easy Answers',
    story: 'A negotiation stalls over the smallest square. You discover that a draw can still be a victory.',
    narration: 'Nothing moves without a cost. Hold the line and earn another hard fought draw.',
    objective: 'Draw 2 matches total.',
    reward: 150,
    xp: 90,
    validate: (profile) => profile.stats.draws >= 2,
  },
  {
    id: 'second-wind',
    title: 'Second Wind',
    chapter: 'Chapter 6: No Easy Answers',
    story: 'Your energy is low, but the next challenge arrives before sunrise. Discipline carries you forward.',
    narration: 'You are tired, not finished. Find your second wind and take the next win.',
    objective: 'Win 10 matches total.',
    reward: 180,
    xp: 100,
    validate: (profile) => profile.stats.wins >= 10,
  },
  {
    id: 'the-mentor',
    title: 'The Mentor',
    chapter: 'Chapter 7: Passing It On',
    story: 'A former champion offers advice, but only after you show you can solve the board yourself.',
    narration: 'A champion is watching. Earn their advice by proving you can solve the board alone.',
    objective: 'Win 11 matches total.',
    reward: 190,
    xp: 105,
    validate: (profile) => profile.stats.wins >= 11,
  },
  {
    id: 'open-secret',
    title: 'The Open Secret',
    chapter: 'Chapter 7: Passing It On',
    story: 'The best players see the obvious move and still ask what comes next. You begin to think two turns ahead.',
    narration: 'The answer is in plain sight. See the move after the move and claim another victory.',
    objective: 'Win 12 matches total.',
    reward: 200,
    xp: 110,
    validate: (profile) => profile.stats.wins >= 12,
  },
  {
    id: 'red-line',
    title: 'Red Line',
    chapter: 'Chapter 8: High Stakes',
    story: 'One careless decision could end your promotion. The safest move is no longer the best move.',
    narration: 'The stakes are rising. Cross the red line with courage and win again.',
    objective: 'Win 13 matches total.',
    reward: 210,
    xp: 115,
    validate: (profile) => profile.stats.wins >= 13,
  },
  {
    id: 'pressure-valve',
    title: 'Pressure Valve',
    chapter: 'Chapter 8: High Stakes',
    story: 'The crowd grows louder with every turn. You find a calm place inside the noise.',
    narration: 'The crowd is loud. Your mind is quiet. Hold your focus and reach fourteen wins.',
    objective: 'Win 14 matches total.',
    reward: 220,
    xp: 120,
    validate: (profile) => profile.stats.wins >= 14,
  },
  {
    id: 'final-interview',
    title: 'Final Interview',
    chapter: 'Chapter 9: The Summit',
    story: 'The executive asks only one question: what will you do when the board refuses to cooperate?',
    narration: 'The final interview begins. Show the executive that pressure only sharpens your play.',
    objective: 'Win 15 matches total.',
    reward: 240,
    xp: 130,
    validate: (profile) => profile.stats.wins >= 15,
  },
  {
    id: 'last-stalemate',
    title: 'Last Stalemate',
    chapter: 'Chapter 9: The Summit',
    story: 'At the summit, neither side will yield. You leave with a draw and the respect of everyone in the room.',
    narration: 'At the summit, neither side will yield. Earn the respect that comes with a third draw.',
    objective: 'Draw 3 matches total.',
    reward: 230,
    xp: 125,
    validate: (profile) => profile.stats.draws >= 3,
  },
  {
    id: 'champions-table',
    title: 'Champions Table',
    chapter: 'Chapter 10: Legacy',
    story: 'Your name is added to the champions table. The next match is no longer about proving yourself.',
    narration: 'Your name is on the champions table. Play like you belong there and reach sixteen wins.',
    objective: 'Win 16 matches total.',
    reward: 260,
    xp: 140,
    validate: (profile) => profile.stats.wins >= 16,
  },
  {
    id: 'legacy-code',
    title: 'Legacy Code',
    chapter: 'Chapter 10: Legacy',
    story: 'You write down the principles that carried you here: patience, pressure, and one clear next move.',
    narration: 'Legacy is built one decision at a time. Add one more win to the record you leave behind.',
    objective: 'Win 17 matches total.',
    reward: 280,
    xp: 150,
    validate: (profile) => profile.stats.wins >= 17,
  },
  {
    id: 'boardroom-crown',
    title: 'The Boardroom Crown',
    chapter: 'Finale',
    story: 'The doors open. Every rival, mentor, and teammate is waiting to see who owns the board.',
    narration: 'The doors are open. This is your boardroom crown. Finish the story with twenty victories.',
    objective: 'Win 20 matches total.',
    reward: 400,
    xp: 220,
    validate: (profile) => profile.stats.wins >= 20,
  },
]

function createEmptyBoard() {
  return Array(9).fill(null)
}

function getWinner(board) {
  for (const [a, b, c] of WINNING_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a]
    }
  }

  return null
}

function getAvailableMoves(board) {
  return board
    .map((cell, index) => (cell === null ? index : null))
    .filter((value) => value !== null)
}

function getNextPlayer(board) {
  return board.filter(Boolean).length % 2 === 0 ? 'X' : 'O'
}

function getRandomAiMove(board) {
  const moves = getAvailableMoves(board)
  if (moves.length === 0) {
    return null
  }

  return moves[Math.floor(Math.random() * moves.length)]
}

function getSmartAiMove(board) {
  const lines = WINNING_LINES

  for (const [a, b, c] of lines) {
    const values = [board[a], board[b], board[c]]
    if (values.filter(Boolean).length === 2 && values.filter((value) => value === 'O').length === 2) {
      const emptyIndex = [a, b, c].find((index) => board[index] === null)
      if (emptyIndex !== undefined) {
        return emptyIndex
      }
    }
  }

  for (const [a, b, c] of lines) {
    const values = [board[a], board[b], board[c]]
    if (values.filter(Boolean).length === 2 && values.filter((value) => value === 'X').length === 2) {
      const emptyIndex = [a, b, c].find((index) => board[index] === null)
      if (emptyIndex !== undefined) {
        return emptyIndex
      }
    }
  }

  if (board[4] === null) {
    return 4
  }

  const corners = [0, 2, 6, 8].filter((index) => board[index] === null)
  if (corners.length > 0) {
    return corners[Math.floor(Math.random() * corners.length)]
  }

  return getRandomAiMove(board)
}

function minimax(board, depth, isMaximizing, aiPlayer, humanPlayer) {
  const winner = getWinner(board)

  if (winner === aiPlayer) {
    return 10 - depth
  }

  if (winner === humanPlayer) {
    return depth - 10
  }

  if (board.every(Boolean)) {
    return 0
  }

  if (isMaximizing) {
    let bestScore = -Infinity
    for (const move of getAvailableMoves(board)) {
      const nextBoard = board.slice()
      nextBoard[move] = aiPlayer
      const score = minimax(nextBoard, depth + 1, false, aiPlayer, humanPlayer)
      bestScore = Math.max(bestScore, score)
    }
    return bestScore
  }

  let bestScore = Infinity
  for (const move of getAvailableMoves(board)) {
    const nextBoard = board.slice()
    nextBoard[move] = humanPlayer
    const score = minimax(nextBoard, depth + 1, true, aiPlayer, humanPlayer)
    bestScore = Math.min(bestScore, score)
  }
  return bestScore
}

function getHardAiMove(board) {
  const aiPlayer = 'O'
  const humanPlayer = 'X'
  let bestMove = null
  let bestScore = -Infinity

  for (const move of getAvailableMoves(board)) {
    const nextBoard = board.slice()
    nextBoard[move] = aiPlayer
    const score = minimax(nextBoard, 0, false, aiPlayer, humanPlayer)

    if (score > bestScore) {
      bestScore = score
      bestMove = move
    }
  }

  return bestMove
}

function getAiMove(board, difficulty = 'medium') {
  if (difficulty === 'easy') {
    return getRandomAiMove(board)
  }

  if (difficulty === 'hard') {
    return getHardAiMove(board)
  }

  return getSmartAiMove(board)
}

function getDefaultProfile() {
  return {
    name: 'Astra',
    stats: {
      wins: 0,
      draws: 0,
      losses: 0,
    },
    streak: {
      current: 0,
      best: 0,
    },
    money: 80,
    career: {
      currentMission: 0,
      completed: [],
      xp: 0,
      level: 1,
    },
    settings: {
      aiDifficulty: 'medium',
    },
    inventory: ['classic'],
    unlockedBackgrounds: ['classic'],
    selectedBackground: 'classic',
  }
}

function normalizeProfile(rawProfile) {
  const defaults = getDefaultProfile()

  if (!rawProfile) {
    return defaults
  }

  return {
    ...defaults,
    ...rawProfile,
    stats: {
      ...defaults.stats,
      ...(rawProfile.stats || {}),
    },
    streak: {
      ...defaults.streak,
      ...(rawProfile.streak || {}),
    },
    career: {
      ...defaults.career,
      ...(rawProfile.career || {}),
      completed: Array.isArray(rawProfile.career?.completed)
        ? rawProfile.career.completed
        : defaults.career.completed,
    },
    settings: {
      ...defaults.settings,
      ...(rawProfile.settings || {}),
    },
    inventory: Array.isArray(rawProfile.inventory)
      ? rawProfile.inventory
      : defaults.inventory,
    unlockedBackgrounds: Array.isArray(rawProfile.unlockedBackgrounds)
      ? rawProfile.unlockedBackgrounds
      : defaults.unlockedBackgrounds,
  }
}

function loadSavedState() {
  const stored = localStorage.getItem(STORAGE_KEY)

  if (!stored) {
    return {
      screen: 'login',
      profile: getDefaultProfile(),
      game: createGameState('ai'),
      profilePanelOpen: false,
    }
  }

  try {
    const parsed = JSON.parse(stored)
    return {
      screen: 'login',
      profile: normalizeProfile(parsed),
      game: createGameState('ai'),
      profilePanelOpen: false,
    }
  } catch {
    return {
      screen: 'login',
      profile: getDefaultProfile(),
      game: createGameState('ai'),
      profilePanelOpen: false,
    }
  }
}

function createGameState(mode = 'ai') {
  return {
    mode,
    history: [createEmptyBoard()],
    currentStep: 0,
    currentPlayer: 'X',
    winner: null,
    isDraw: false,
  }
}

function applyCareerProgress(profile) {
  const nextProfile = {
    ...profile,
    career: {
      ...profile.career,
      completed: [...profile.career.completed],
    },
  }

  for (const mission of CAREER_MISSIONS) {
    if (nextProfile.career.completed.includes(mission.id)) {
      continue
    }

    if (mission.validate(nextProfile)) {
      nextProfile.career.completed.push(mission.id)
      nextProfile.money += mission.reward
      nextProfile.career.xp += mission.xp
      nextProfile.career.currentMission = Math.max(
        nextProfile.career.currentMission,
        CAREER_MISSIONS.findIndex((item) => item.id === mission.id) + 1,
      )
    }
  }

  nextProfile.career.level = 1 + Math.floor(nextProfile.career.xp / 120)

  return nextProfile
}

function applyMatchResult(profile, winner, isDraw) {
  const nextProfile = {
    ...profile,
    stats: {
      ...profile.stats,
    },
    streak: {
      ...profile.streak,
    },
  }

  if (isDraw) {
    nextProfile.stats.draws += 1
    nextProfile.streak.current = 0
  } else if (winner === 'X') {
    nextProfile.stats.wins += 1
    nextProfile.streak.current += 1
    nextProfile.streak.best = Math.max(nextProfile.streak.best, nextProfile.streak.current)
  } else {
    nextProfile.stats.losses += 1
    nextProfile.streak.current = 0
  }

  return applyCareerProgress(nextProfile)
}

function appReducer(state, action) {
  switch (action.type) {
    case 'LOAD_PROFILE':
      return {
        ...state,
        screen: 'home',
        profile: normalizeProfile(action.profile),
        profilePanelOpen: false,
      }

    case 'CONTINUE_AS_GUEST':
      return { ...state, screen: 'home', profilePanelOpen: false }

    case 'SET_SCREEN':
      return { ...state, screen: action.screen, profilePanelOpen: false }

    case 'TOGGLE_PROFILE_PANEL':
      return { ...state, profilePanelOpen: !state.profilePanelOpen }

    case 'SET_PROFILE_NAME': {
      return {
        ...state,
        profile: {
          ...state.profile,
          name: action.name.slice(0, 20),
        },
      }
    }

    case 'UPDATE_SETTING': {
      return {
        ...state,
        profile: {
          ...state.profile,
          settings: {
            ...state.profile.settings,
            [action.key]: action.value,
          },
        },
      }
    }

    case 'START_MATCH': {
      const nextGame = createGameState(action.mode)
      const nextProfile = {
        ...state.profile,
        settings: {
          ...state.profile.settings,
          aiDifficulty: action.difficulty || state.profile.settings.aiDifficulty,
        },
      }

      return {
        ...state,
        profile: nextProfile,
        screen: 'game',
        profilePanelOpen: false,
        game: nextGame,
      }
    }

    case 'RESET_GAME': {
      return {
        ...state,
        game: createGameState(state.game.mode),
      }
    }

    case 'MAKE_MOVE': {
      const board = state.game.history[state.game.currentStep].slice()
      const moveIndex = action.index

      if (board[moveIndex] || state.game.winner || state.game.isDraw) {
        return state
      }

      const nextBoard = board.slice()
      nextBoard[moveIndex] = state.game.currentPlayer
      const winner = getWinner(nextBoard)
      const isDraw = !winner && nextBoard.every(Boolean)
      const nextPlayer = winner || isDraw ? state.game.currentPlayer : getNextPlayer(nextBoard)
      const nextHistory = [...state.game.history.slice(0, state.game.currentStep + 1), nextBoard]

      let nextProfile = state.profile
      if (winner || isDraw) {
        nextProfile = applyMatchResult(state.profile, winner, isDraw)
      }

      return {
        ...state,
        profile: nextProfile,
        game: {
          ...state.game,
          history: nextHistory,
          currentStep: nextHistory.length - 1,
          currentPlayer: nextPlayer,
          winner,
          isDraw,
        },
      }
    }

    case 'JUMP_TO_MOVE': {
      const board = state.game.history[action.step].slice()
      const winner = getWinner(board)
      const isDraw = !winner && board.every(Boolean)
      const nextPlayer = winner || isDraw ? 'X' : getNextPlayer(board)

      return {
        ...state,
        game: {
          ...state.game,
          currentStep: action.step,
          currentPlayer: nextPlayer,
          winner,
          isDraw,
        },
      }
    }

    case 'PURCHASE_ITEM': {
      const item = SHOP_CATALOG.find((entry) => entry.id === action.id)
      if (!item) {
        return state
      }

      if (state.profile.money < item.price || state.profile.inventory.includes(item.id)) {
        return state
      }

      return {
        ...state,
        profile: {
          ...state.profile,
          money: state.profile.money - item.price,
          inventory: [...state.profile.inventory, item.id],
        },
      }
    }

    case 'BUY_BACKGROUND': {
      const match = BACKGROUNDS.find((entry) => entry.id === action.id)
      if (!match) {
        return state
      }

      if (state.profile.money < match.price || state.profile.unlockedBackgrounds.includes(match.id)) {
        return state
      }

      return {
        ...state,
        profile: {
          ...state.profile,
          money: state.profile.money - match.price,
          unlockedBackgrounds: [...state.profile.unlockedBackgrounds, match.id],
          selectedBackground: match.id,
        },
      }
    }

    case 'SELECT_BACKGROUND': {
      if (!state.profile.unlockedBackgrounds.includes(action.id)) {
        return state
      }

      return {
        ...state,
        profile: {
          ...state.profile,
          selectedBackground: action.id,
        },
      }
    }

    default:
      return state
  }
}

function App() {
  const [state, dispatch] = useReducer(appReducer, undefined, loadSavedState)
  const [narratingMission, setNarratingMission] = useState(null)
  const [account, setAccount] = useState(null)
  const [accountReady, setAccountReady] = useState(false)
  const [googleClientId, setGoogleClientId] = useState('')
  const [cloudReady, setCloudReady] = useState(false)
  const [accountMessage, setAccountMessage] = useState('Checking account...')
  const loginGoogleButtonRef = useRef(null)
  const headerGoogleButtonRef = useRef(null)
  const profileRef = useRef(state.profile)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.profile))
  }, [state.profile])

  useEffect(() => {
    profileRef.current = state.profile
  }, [state.profile])

  useEffect(() => {
    let active = true

    const restoreAccount = async () => {
      try {
        const [configResponse, playerResponse] = await Promise.all([
          fetch('/api/config'),
          fetch('/api/auth/session', { credentials: 'same-origin' }),
        ])
        if (!configResponse.ok) {
          throw new Error('Account service is unavailable.')
        }

        const config = await configResponse.json()
        const playerData = playerResponse.ok ? await playerResponse.json() : null
        if (!active) {
          return
        }

        setGoogleClientId(config.googleClientId || '')
        setCloudReady(Boolean(config.cloudReady))
        if (playerData?.authenticated) {
          dispatch({ type: 'LOAD_PROFILE', profile: playerData.profile })
          setAccount(playerData.player)
          setAccountMessage('Cloud profile connected')
        } else if (!config.cloudReady) {
          setAccountMessage('Google and MongoDB server settings are needed for cloud saves.')
        } else if (!playerResponse.ok) {
          setAccountMessage('Could not load cloud profile. Guest play is still available.')
        } else {
          setAccountMessage('Sign in with Google to save your profile to the cloud.')
        }
      } catch {
        if (active) {
          setAccountMessage('Cloud service unavailable. Guest data stays on this device.')
        }
      } finally {
        if (active) {
          setAccountReady(true)
        }
      }
    }

    restoreAccount()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const googleButtonRef = state.screen === 'login' ? loginGoogleButtonRef : headerGoogleButtonRef
    if (!accountReady || !cloudReady || !googleClientId || account || !googleButtonRef.current) {
      return undefined
    }

    const onGoogleScriptLoad = () => {
      if (!window.google?.accounts?.id || !googleButtonRef.current) {
        setAccountMessage('Google sign-in could not be loaded.')
        return
      }

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async ({ credential }) => {
          setAccountMessage('Signing in...')
          try {
            const response = await fetch('/api/auth/google', {
              method: 'POST',
              credentials: 'same-origin',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ credential, guestProfile: profileRef.current }),
            })
            const result = await response.json()
            if (!response.ok) {
              throw new Error(result.error || 'Google sign-in failed.')
            }

            dispatch({ type: 'LOAD_PROFILE', profile: result.profile })
            setAccount(result.player)
            setAccountMessage('Cloud profile connected')
          } catch (error) {
            setAccountMessage(error.message || 'Google sign-in failed.')
          }
        },
      })
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text: 'signin_with',
        width: 190,
      })
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = onGoogleScriptLoad
    script.onerror = () => setAccountMessage('Google sign-in could not be loaded.')
    document.head.appendChild(script)

    return () => {
      script.onload = null
      script.remove()
    }
  }, [account, accountReady, cloudReady, googleClientId, state.screen])

  useEffect(() => {
    if (!account || !accountReady) {
      return undefined
    }

    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch('/api/player', {
          method: 'PUT',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile: state.profile }),
        })
        if (response.status === 401) {
          setAccount(null)
          setAccountMessage('Session expired. Sign in again to resume cloud saves.')
          return
        }
        if (!response.ok) {
          throw new Error('Cloud save failed.')
        }
        setAccountMessage('Saved to cloud')
      } catch {
        setAccountMessage('Cloud save unavailable. Changes remain on this device.')
      }
    }, 450)

    return () => window.clearTimeout(timer)
  }, [account, accountReady, state.profile])

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' })
    } finally {
      setAccount(null)
      setAccountMessage('Signed out. This device profile remains available.')
      dispatch({ type: 'SET_SCREEN', screen: 'login' })
    }
  }

  useEffect(() => () => window.speechSynthesis?.cancel(), [])

  const narrateMission = (mission) => {
    if (!('speechSynthesis' in window)) {
      return
    }

    window.speechSynthesis.cancel()
    const narration = new SpeechSynthesisUtterance(`${mission.title}. ${mission.narration} Objective: ${mission.objective}`)
    const voices = window.speechSynthesis.getVoices()
    const preferredVoice = voices.find((voice) => /Samantha|Daniel|Microsoft Aria|Google US English/i.test(voice.name))

    narration.voice = preferredVoice || voices.find((voice) => voice.lang.startsWith('en')) || null
    narration.lang = 'en-US'
    narration.rate = 0.92
    narration.pitch = 0.96
    narration.volume = 1
    narration.onstart = () => setNarratingMission(mission.id)
    narration.onend = () => setNarratingMission(null)
    narration.onerror = () => setNarratingMission(null)
    setNarratingMission(mission.id)
    window.speechSynthesis.speak(narration)
  }

  const stopNarration = () => {
    window.speechSynthesis?.cancel()
    setNarratingMission(null)
  }

  const activeBackground = BACKGROUNDS.find((item) => item.id === state.profile.selectedBackground) || BACKGROUNDS[0]
  const board = state.game.history[state.game.currentStep]
  const isGameOver = Boolean(state.game.winner) || state.game.isDraw
  const aiTurn = state.game.mode === 'ai' && state.game.currentPlayer === 'O' && !isGameOver
  const totalMatches = state.profile.stats.wins + state.profile.stats.draws + state.profile.stats.losses
  const winRate = totalMatches === 0 ? 0 : Math.round((state.profile.stats.wins / totalMatches) * 100)

  useEffect(() => {
    if (!aiTurn) {
      return undefined
    }

    const timer = window.setTimeout(() => {
      const move = getAiMove(board, state.profile.settings.aiDifficulty)
      if (move !== null && move !== undefined) {
        dispatch({ type: 'MAKE_MOVE', index: move })
      }
    }, 550)

    return () => window.clearTimeout(timer)
  }, [aiTurn, board, state.profile.settings.aiDifficulty])

  const status = state.game.winner
    ? state.game.winner === 'X'
      ? 'Victory! You won the round.'
      : 'Defeat! Your opponent won.'
    : state.game.isDraw
      ? 'Draw! No winner this time.'
      : `Next Player: ${state.game.currentPlayer}`

  const missionProgress = CAREER_MISSIONS.map((mission) => ({
    ...mission,
    completed: state.profile.career.completed.includes(mission.id),
  }))

  return (
    <main className="app-shell" style={{ background: activeBackground.gradient }}>
      <div className="app-window">
        {state.screen === 'login' && (
          <section className="screen-panel login-panel" aria-labelledby="login-title">
            <div className="login-brand">
              <p className="eyebrow">© Ntsika Ngilane @Zaio</p>
              <h1 className="brand-title">Tic Tac Toe</h1>
            </div>
            <div className="login-copy">
              <p className="eyebrow">Player account</p>
              <h2 id="login-title">Your next move starts here.</h2>
              <p>Sign in to load your saved profile and keep your career progress across devices.</p>
            </div>
            <div className="login-actions">
              {!accountReady ? (
                <p className="login-status" role="status">Checking for a saved account...</p>
              ) : cloudReady ? (
                <div className="google-signin-button login-google-button" ref={loginGoogleButtonRef} />
              ) : (
                <p className="login-status" role="status">{accountMessage}</p>
              )}
              <button
                type="button"
                className="action-button guest-button"
                onClick={() => dispatch({ type: 'CONTINUE_AS_GUEST' })}
                disabled={!accountReady}
              >
                Continue as guest
              </button>
              {accountReady && <span className="login-note">Guest progress stays on this device.</span>}
            </div>
          </section>
        )}

        {state.screen !== 'login' && <header className="topbar">
          <div>
            <p className="eyebrow">© Ntsika Ngilane @Zaio</p>
            <h1 className="brand-title">Tic Tac Toe</h1>
          </div>

          <div className="header-profile">
            <button
              type="button"
              className="profile-pill profile-toggle"
              aria-expanded={state.profilePanelOpen}
              onClick={() => dispatch({ type: 'TOGGLE_PROFILE_PANEL' })}
            >
              <span className="label">Agent</span>
              <strong>{state.profile.name}</strong>
            </button>
            <div className="profile-pill">
              <span className="label">Cash</span>
              <strong>${state.profile.money}</strong>
            </div>
            <button type="button" className="shop-mini-button" onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'shop' })}>
              Shop
            </button>
            <div className="account-controls">
              {account ? (
                <>
                  <span className="account-identity">{account.name}</span>
                  <button type="button" className="shop-mini-button" onClick={signOut}>
                    Sign out
                  </button>
                </>
              ) : accountReady && cloudReady ? (
                <div className="google-signin-button" ref={headerGoogleButtonRef} />
              ) : null}
              <span className="account-message" role="status">{accountMessage}</span>
            </div>
          </div>
        </header>}

        {state.profilePanelOpen && (
          <section className="screen-panel profile-info-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Player information</p>
                <h2>{state.profile.name}</h2>
              </div>
              <button
                type="button"
                className="action-button ghost"
                onClick={() => dispatch({ type: 'TOGGLE_PROFILE_PANEL' })}
              >
                Close
              </button>
            </div>

            <div className="profile-stats-grid">
              <div className="profile-stat-card">
                <span>Wins</span>
                <strong>{state.profile.stats.wins}</strong>
              </div>
              <div className="profile-stat-card">
                <span>Draws</span>
                <strong>{state.profile.stats.draws}</strong>
              </div>
              <div className="profile-stat-card">
                <span>Losses</span>
                <strong>{state.profile.stats.losses}</strong>
              </div>
            </div>

            <div className="profile-streak-grid">
              <div className="profile-streak-card">
                <span>Current streak</span>
                <strong>{state.profile.streak.current}</strong>
              </div>
              <div className="profile-streak-card">
                <span>Best streak</span>
                <strong>{state.profile.streak.best}</strong>
              </div>
              <div className="profile-streak-card">
                <span>Win rate</span>
                <strong>{winRate}%</strong>
              </div>
            </div>
          </section>
        )}

        {state.screen === 'home' && (
          <section className="screen-panel hero-panel intro-panel">
            <div className="hero-copy intro-copy">
              <span className="tag">© Ntsika Ngilane @Zaio</span>
              <h2>Tic Tac Toe Arena</h2>
              <p>
                Build your streak, conquer missions, and prove you belong in the boardroom.
              </p>
            </div>

            <div className="home-grid">
              <button className="home-option primary" type="button" onClick={() => dispatch({ type: 'START_MATCH', mode: 'ai', difficulty: state.profile.settings.aiDifficulty })}>
                <span>AI Opponent</span>
                <small>Train against the machine.</small>
              </button>

              <button className="home-option" type="button" onClick={() => dispatch({ type: 'START_MATCH', mode: 'human' })}>
                <span>2 Players</span>
                <small>Local duel for quick face-to-face rounds.</small>
              </button>

              <button className="home-option" type="button" onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'career' })}>
                <span>Career Mode</span>
                <small>Story missions and progression rewards.</small>
              </button>

              <button className="home-option" type="button" onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'settings' })}>
                <span>Settings</span>
                <small>Adjust your profile and AI difficulty.</small>
              </button>
            </div>
          </section>
        )}

        {state.screen === 'game' && (
          <section className="screen-panel game-panel">
            <div className="game-toolbar">
              <div className="mode-badges">
                <span className="mode-badge">{state.game.mode === 'ai' ? 'AI Match' : 'Local Match'}</span>
                <span className="mode-badge subtle">Level {state.profile.career.level}</span>
              </div>

              {state.game.mode === 'ai' && (
                <div className="difficulty-row">
                  {DIFFICULTIES.map((difficulty) => (
                    <button
                      key={difficulty.id}
                      type="button"
                      className={state.profile.settings.aiDifficulty === difficulty.id ? 'difficulty-button active' : 'difficulty-button'}
                      onClick={() =>
                        dispatch({
                          type: 'UPDATE_SETTING',
                          key: 'aiDifficulty',
                          value: difficulty.id,
                        })
                      }
                    >
                      {difficulty.label}
                    </button>
                  ))}
                </div>
              )}

              <button className="action-button" type="button" onClick={() => dispatch({ type: 'RESET_GAME' })}>
                Restart
              </button>

              <button className="action-button ghost" type="button" onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'home' })}>
                Home
              </button>
            </div>

            <div className="status-panel" aria-live="polite">
              {status}
            </div>

            <div className="board-wrapper">
              <div className="board" role="grid" aria-label="Tic Tac Toe board">
                {board.map((cell, index) => {
                  const disabled = Boolean(cell) || isGameOver || (state.game.mode === 'ai' && state.game.currentPlayer === 'O')

                  return (
                    <button
                      key={index}
                      type="button"
                      className={`cell ${cell ? 'filled' : ''}`}
                      onClick={() => dispatch({ type: 'MAKE_MOVE', index })}
                      disabled={disabled}
                      aria-label={`Cell ${index + 1}${cell ? ` occupied by ${cell}` : ' empty'}`}
                    >
                      {cell}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="history-panel" aria-label="Move history">
              <h3>Move history</h3>
              <ol className="history-list">
                {state.game.history.map((_, moveIndex) => {
                  const label = moveIndex === 0 ? 'Go to start' : `Go to move #${moveIndex}`

                  return (
                    <li key={moveIndex}>
                      <button
                        type="button"
                        className={moveIndex === state.game.currentStep ? 'active' : ''}
                        onClick={() => dispatch({ type: 'JUMP_TO_MOVE', step: moveIndex })}
                      >
                        {label}
                      </button>
                    </li>
                  )
                })}
              </ol>
            </div>
          </section>
        )}

        {state.screen === 'career' && (
          <section className="screen-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Career mode</p>
                <h2>Storyline missions</h2>
              </div>
              <button className="action-button ghost" type="button" onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'home' })}>
                Back home
              </button>
            </div>

            <div className="career-summary">
              <div className="summary-card">
                <span>Career level</span>
                <strong>{state.profile.career.level}</strong>
              </div>
              <div className="summary-card">
                <span>XP</span>
                <strong>{state.profile.career.xp}</strong>
              </div>
              <div className="summary-card">
                <span>Cash earned</span>
                <strong>${state.profile.money}</strong>
              </div>
            </div>

            <div className="mission-list">
              {missionProgress.map((mission) => (
                <article key={mission.id} className={`mission-card ${mission.completed ? 'done' : ''}`}>
                  <span className="mission-chapter">{mission.chapter}</span>
                  <h3>{mission.title}</h3>
                  <p>{mission.story}</p>
                  <div className="mission-narration">
                    <span className="voice-mark" aria-hidden="true">◉</span>
                    <span>Voice briefing available</span>
                    <button
                      type="button"
                      className="voice-button"
                      onClick={() => narratingMission === mission.id ? stopNarration() : narrateMission(mission)}
                      aria-label={`${narratingMission === mission.id ? 'Stop' : 'Play'} narration for ${mission.title}`}
                    >
                      {narratingMission === mission.id ? 'Stop' : 'Listen'}
                    </button>
                  </div>
                  <strong>{mission.objective}</strong>
                  <div className="mission-reward">
                    <span>Reward: ${mission.reward}</span>
                    <span>XP: {mission.xp}</span>
                  </div>
                  <button
                    className="action-button"
                    type="button"
                    onClick={() => dispatch({ type: 'START_MATCH', mode: 'ai' })}
                    disabled={mission.completed}
                  >
                    {mission.completed ? 'Completed' : 'Play mission'}
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}

        {state.screen === 'shop' && (
          <section className="screen-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Merch store</p>
                <h2>Buy upgrades</h2>
              </div>
              <button className="action-button ghost" type="button" onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'home' })}>
                Back home
              </button>
            </div>

            <div className="shop-grid">
              {BACKGROUNDS.map((background) => {
                const owned = state.profile.unlockedBackgrounds.includes(background.id)
                const active = state.profile.selectedBackground === background.id

                return (
                  <div key={background.id} className={`shop-card ${active ? 'active' : ''}`}>
                    <div className="shop-preview" style={{ background: background.gradient }} />
                    <h3>{background.name}</h3>
                    <p>{owned ? 'Unlocked' : `Price: $${background.price}`}</p>
                    {owned ? (
                      <button type="button" className="action-button" onClick={() => dispatch({ type: 'SELECT_BACKGROUND', id: background.id })}>
                        {active ? 'Equipped' : 'Equip'}
                      </button>
                    ) : (
                      <button type="button" className="action-button" onClick={() => dispatch({ type: 'BUY_BACKGROUND', id: background.id })}>
                        Buy background
                      </button>
                    )}
                  </div>
                )
              })}

              {SHOP_CATALOG.map((item) => {
                const owned = state.profile.inventory.includes(item.id)

                return (
                  <div key={item.id} className="shop-card">
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                    <strong>{owned ? 'Owned' : `Cost: $${item.price}`}</strong>
                    {!owned && (
                      <button type="button" className="action-button" onClick={() => dispatch({ type: 'PURCHASE_ITEM', id: item.id })}>
                        Buy item
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {state.screen === 'settings' && (
          <section className="screen-panel settings-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Settings</p>
                <h2>Agent configuration</h2>
              </div>
              <button className="action-button ghost" type="button" onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'home' })}>
                Back home
              </button>
            </div>

            <label className="field-label">
              Agent name
              <input
                value={state.profile.name}
                onChange={(event) => dispatch({ type: 'SET_PROFILE_NAME', name: event.target.value })}
                placeholder="Enter your pilot name"
              />
            </label>

            <div className="settings-row">
              <label className="field-label">
                AI difficulty
                <select
                  value={state.profile.settings.aiDifficulty}
                  onChange={(event) =>
                    dispatch({
                      type: 'UPDATE_SETTING',
                      key: 'aiDifficulty',
                      value: event.target.value,
                    })
                  }
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </label>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}

export default App
