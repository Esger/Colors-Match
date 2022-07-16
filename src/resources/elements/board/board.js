import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';

@inject(EventAggregator)
export class BoardCustomElement {

    constructor(eventAggregator) {
        this._eventAggregator = eventAggregator;
        this._tileSize = 9;
        this._highestValue = 1;
        this._score = 0;
        this.boardSize = 5; // / @boardSize
        this.center = Math.floor(this.boardSize / 2);
        this.board = [];
        this.showBoard = true;
        this.offset = this.boardSize * 2 / (this.boardSize + 1);
        this.distance = this._tileSize + this.offset;
        this._newValues = [1];
        this._gameEnd = false;
    }

    _newTile(x, y) {
        let tile = {
            x: x,
            y: y,
            id: 'tile_' + y + '-' + x,
            value: 1
        };
        return tile;
    }

    _newBoard() {
        this._highestValue = 1;
        this._newValues = [1];
        this._score = 0;
        this.showBoard = false;

        this.board = [];
        for (let y = 0; y < this.boardSize; y++) {
            let row = [];
            for (let x = 0; x < this.boardSize; x++) {
                row.push(this._newTile(x, y));
            }
            this.board.push(row);
        }
        setTimeout(() => {
            this.showBoard = true;
        }, 200);
    }

    attached() {
        this._newBoard();
        this._addListeners();
    }

    detached() {
        this._removeListeners();
    }

    _addListeners() {
        this._moveListener = this._eventAggregator.subscribe('request-move', move => {
            this._currentTile = this.board[move.tile.y][move.tile.x];
            this._moveIfValid(move); // x,y,directions[y,x]
        });
        this.restartListener = this._eventAggregator.subscribe('restart', () => {
            this._restartGame();
        });
    }

    _removeListeners() {
        this.restartListener.dispose();
    }

    _restartGame() {
        this._gameEnd = false;
        this._newBoard();
        this._eventAggregator.publish('reset-score');
    }

    _moveIfValid(move) {
        let target = [move.tile.y + move.directions[0], move.tile.x + move.directions[1]]; // coords
        let targetTile = this.board[target[0]][target[1]];
        if (move.tile.value == targetTile.value) {
            // animate the dragged tile to the target
            move.animate = true;
            this._eventAggregator.publish('move', move);
            let tilesBehind = this._findTilesBehind(move);
            // wait for animation to target
            setTimeout(() => {
                this._eventAggregator.publish('correct', targetTile);
                targetTile.value *= 2;
                this._setBackTiles(tilesBehind, move.directions);
                this._shiftValues(tilesBehind, move.directions);

                // animate the intruding tiles on the board
                let time = this._animateTiles(tilesBehind, move.directions);
                setTimeout(() => {
                    tilesBehind.unshift(targetTile);
                    this._afterCheck(tilesBehind);
                    this._eventAggregator.publish('unlockTiles');
                    this._checkGameEnd();
                }, time);
            }, 200);
        } else {
            this._eventAggregator.publish('reset', move);
            this._eventAggregator.publish('unlockTiles');
        }
    }

    _afterCheck(tiles) {
        let centerTile = tiles.filter(tile => {
            return tile.x == this.center && tile.y == this.center;
        });
        if (centerTile.length && centerTile[0].value > this._highestValue) {
            this._highestValue = centerTile[0].value;
            this._eventAggregator.publish('high', centerTile[0].value);
        }
    }

    _setBackTiles(tiles, directions) {

        let oppositeDirections = [-directions[0], -directions[1]];

        // shift the tiles 1 place in opposite direction as moved tile 
        for (let i = 0; i < tiles.length; i++) {
            let vector = {
                tile: tiles[i],
                directions: oppositeDirections,
                animate: false
            };
            this._eventAggregator.publish('move', vector);
        }
    }

    _shiftValues(tiles, directions) {
        // shift values of tiles one place in same direction as moved tile
        let last = tiles.length - 1;
        for (let i = 0; i < last; i++) {
            this.board[tiles[i].y][tiles[i].x].value = this.board[tiles[i].y - directions[0]][tiles[i].x - directions[1]].value;
        }

        // fill outermost tile with random power of 2 smaller than highestValue
        this.board[tiles[last].y][tiles[last].x].value = this._getRandomPowerOf2();
    }

    _animateTiles(tiles, directions) {
        const ddt = 100;
        let dt = 100;
        if (tiles.length) {
            // the first [0] tile is the dragged one
            for (let i = 0; i < tiles.length; i++) {
                const tile = tiles[i];
                let vector = {
                    tile: tile,
                    directions: [0, 0],
                    animate: true
                };
                setTimeout(() => {
                    this._eventAggregator.publish('move', vector);
                }, dt);
                dt += ddt;
            }
        }
        return dt;
    }

    // find the tiles behind the moved tile from the empty place to the wall
    _findTilesBehind(move) {
        let tilesBehind = [];
        let t = [move.tile.y, move.tile.x];
        // if one of the directions > 0 then step = -1 (opposite direction)
        let step = move.directions.some(v => { return v > 0; }) ? -1 : 1;
        let max = (step > 0) ? this.boardSize : -1;
        let start = (move.directions[0] == 0) ? t[1] : t[0];
        for (let i = start; i != max; i += step) {
            tilesBehind.push(this.board[t[0]][t[1]]);
            t = t.map((pos, j) => { return pos - move.directions[j]; });
        }
        return tilesBehind;
    }

    // Probability of lower number is higher
    _getRandomPowerOf2() {
        if (this._highestValue > this._newValues[this._newValues.length - 1]) {
            this._newValues = [];
            let max = this._highestValue;
            let val = 1;
            while (max > 1) {
                for (let i = 0; i < max; i++) {
                    this._newValues.push(val);
                }
                max /= 2;
                val *= 2;
            }
            this._newValues.push(val);
        }
        return this._newValues[Math.floor(Math.random() * (this._newValues.length - 1))];
    }

    _movesHorPossible() {
        let equals = false;
        this.board.forEach(row => {
            row.forEach((tile, x) => {
                const nextTile = row[x + 1];
                if (nextTile) {
                    equals = equals || nextTile.value == tile.value;
                }
            });
        });
        return equals;
    }

    _movesVerPossible() {
        let equals = false;
        this.board[0].forEach((tile, x) => {
            this.board.forEach((row, y) => {
                const current = row[x].value;
                const nextRow = this.board[y + 1];
                if (nextRow) {
                    const next = nextRow[x].value;
                    equals = equals || next == current;
                }
            });
        });
        return equals;
    }

    _checkGameEnd() {
        // wait for animation of intruding tiles
        if (!this._movesHorPossible() && !this._movesVerPossible()) {
            this._endGame();
        }
    }

    _endGame() {
        this._gameEnd = true;
        this._eventAggregator.publish('burn');
        this.board.forEach(row => {
            row.forEach(tile => {
                setTimeout(() => {
                    this._eventAggregator.publish('onfire', tile);
                }, Math.random() * 1500);
            });
        });
    }

}
