import { createContext } from 'react';
import { GameMode } from '../enums';

export const GameModeContext = createContext<React.Dispatch<React.SetStateAction<GameMode>>>(() => { });