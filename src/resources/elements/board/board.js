import { inject } from 'aurelia-framework';
import { DragService } from 'resources/services/drag-service';
import { EventAggregator } from 'aurelia-event-aggregator';

@inject(DragService, EventAggregator)
export class BoardCustomElement {

    constructor(dragService, eventAggregator) {
        this.dragService = dragService;
        this._eventAggregator = eventAggregator;
        this._boardSize = 5; // / @boardSize
        this._tileSize = 8;
        this._center = Math.floor(this._boardSize / 2);
        this._highestValue = 1;
        this._score = 0;
        this.board = [];
        this.showBoard = true;
        this.offset = this._boardSize * 2 / (this._boardSize + 1);
        this.distance = this._tileSize + this.offset;
        this._newValues = [1];
        this._gameEnd = false;
    }

    _newTile(x, y) {
        return {
            value: 1,
            id: 'tile_' + y + '-' + x
        };
    }

    _newBoard() {
        this.board = [];
        for (let y = 0; y < this._boardSize; y++) {
            let row = [];
            for (let x = 0; x < this._boardSize; x++) {
                row.push(this._newTile(x, y));
            }
            this.board.push(row);
        }
        $('.tile').removeClass('incorrect correct follow attracted retracted onfire burn dragging');
    }

    attached() {
        this._newBoard();

        setTimeout(() => {
            this._tileWidth = $('.tile').width() / this.distance * (this.distance + 2);
        });
        this._addListeners();
    }

    detached() {
        this._removeListeners();
    }

    _removeListeners() {
        this.startDragListener.dispose();
        this.doDragListener.dispose();
        this.stopDragListener.dispose();
    }

    _addListeners() {
        this.startDragListener = this._eventAggregator.subscribe('startDrag', tile => {
            this._startDragHandler(tile);
        });

        this.doDragListener = this._eventAggregator.subscribe('doDrag', tile => {
            this._doDragHandler(tile);
        });

        this.stopDragListener = this._eventAggregator.subscribe('stopDrag', () => {
            this._stopDragHandler();
        });

        this.restartListener = this._eventAggregator.subscribe('restart', () => {
            this._restartGame();
        });

    }

    _restartGame() {
        this._gameEnd = false;
        this._releaseTile = false;
        this._newBoard();
        this._removeListeners();
        this._addListeners();
        this._eventAggregator.publish('reset-score');
    }

    _startDragHandler(tile) {
        if (!this._gameEnd) {
            this._draggedValue = this.board[tile.y][tile.x].value;
            this._dragTileIndex = [tile.y, tile.x];
            this._releaseTile = false;
            this._$tile = $(tile.element);
            this._$tile.addClass('dragging');
            this._startPosition = {
                left: tile.left,
                top: tile.top
            };
            this._delta = [0, 0];
            this._oneDelta = [0, 0];
        }
    }

    _doDragHandler(tile) {
        if (!this._releaseTile) {
            this._delta[1] += tile.left;
            this._delta[0] += tile.top;
            let absDelta = [Math.abs(this._delta[0]), Math.abs(this._delta[1])];
            this._oneDelta = (absDelta[1] > absDelta[0]) ? [0, this._delta[1]] : [this._delta[0], 0];
            let signs = [Math.sign(this._oneDelta[0]), Math.sign(this._oneDelta[1])];
            let target = [this._dragTileIndex[0] + signs[0], this._dragTileIndex[1] + signs[1]];
            if (this._underTreshold(this._oneDelta)) {
                this._moveTile(this._oneDelta[1] / 1.6, this._oneDelta[0] / 1.6);
            } else {
                let targetValue = this.board[target[0]][target[1]].value;
                this._releaseTile = true;
                if (this._draggedValue == targetValue) {
                    // animate dragged tile to target
                    this._moveTile(signs[1] * this._tileWidth, signs[0] * this._tileWidth);
                    this._doubleTile(target);
                    let tilesBehind = this._findTilesBehind(signs);
                    // animate the intruding tiles on the board
                    this._moveTiles(tilesBehind, signs);
                    setTimeout(() => {
                        this._shiftTilesBehind(tilesBehind);
                        this._checkGameEnd();
                    }, 300);

                } else {
                    this._resetTile();
                }
            }
        }
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
        setTimeout(() => {
            if (!this._movesHorPossible() || !this._movesVerPossible()) {
                this._endGame();
            }
        }, 300);
    }

    _endGame() {
        this._gameEnd = true;
        $('.tile').addClass('burn');
        setTimeout(() => {
            $('.tile').addClass('onfire');
        });
    }

    _stopDragHandler() {
        if (this._underTreshold(this._oneDelta)) {
            this._$tile.addClass('retracted');
            this._moveTile(0, 0);
        }
        this._releaseTile = true;
        setTimeout(() => {
            this._$tile.removeClass('dragging retracted');
        }, 300);
    }

    _moveTile(x, y) {
        this._$tile.addClass('attracted ');
        setTimeout(() => {
            this._$tile.css({
                transform: 'translate(' + x + 'px, ' + y + 'px)'
            });
            setTimeout(() => {
                this._$tile.removeClass('attracted correct');
            }, 200);
        });
    }

    _moveTiles(tiles, signs) {
        tiles.forEach(tile => {
            let $tile = $('#' + tile.id);
            $tile.addClass('follow');
            let dx = signs[1] * this._tileWidth;
            let dy = signs[0] * this._tileWidth;
            let dt = 50;
            setTimeout(() => {
                $tile.css({
                    transform: 'translate(' + dx + 'px, ' + dy + 'px)'
                });
            }, dt);
        });
    }

    _withinBoundaries(target) {
        let inRow = target[1] >= 0 && target[1] < this._boardSize;
        let inCol = target[0] >= 0 && target[0] < this._boardSize;
        return inRow && inCol;
    }

    // find the tiles behind the moved tile from the empty place to the wall
    _findTilesBehind(directions) {
        let t = this._dragTileIndex.slice();
        let tilesBehind = [];
        let step = directions.some(v => { return v > 0; }) ? -1 : 1;
        let max = (step > 0) ? this._boardSize : -1;
        let start = (directions[0] == 0) ? t[1] : t[0];
        for (let i = start; i != max; i += step) {
            tilesBehind.push(t);
            t = t.map((pos, j) => { return pos - directions[j]; });
        }
        return tilesBehind;
    }

    // shift the tiles behind 1 place in same direction as target and fill outermost tile with random power of 2 smaller than highestValue.
    _shiftTilesBehind(tiles, directions) {
        $('.tile').css({
            transform: 'translate(0, 0)'
        });
        let last = tiles.length - 1;
        for (let i = 0; i < last; i++) {
            this.board[tiles[i][0]][tiles[i][1]].value = this.board[tiles[i + 1][0]][tiles[i + 1][1]].value;
        }
        this.board[tiles[last][0]][tiles[last][1]].value = this._getRandomPowerOf2();
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

    _doubleTile(pos) {
        this._$tile.addClass('correct');
        let value = this.board[pos[0]][pos[1]].value;
        this._score += value;
        this.board[pos[0]][pos[1]].value *= 2;
        this._highestValue = (pos[0] == pos[1] && pos[0] == this._center) ? Math.max(this._highestValue, this.board[pos[0]][pos[1]].value) : this._highestValue;
        this._eventAggregator.publish('score', value);
        this._eventAggregator.publish('high', this._highestValue);
    }

    _resetTile() {
        this._$tile.addClass('incorrect');
        this._moveTile(0, 0);
        setTimeout(() => {
            this._$tile.removeClass('dragging attracted retracted incorrect');
        }, 500);
    }

    _underTreshold(constrainedDistance) {
        let value = Math.max(Math.abs(constrainedDistance[0]), Math.abs(constrainedDistance[1]));
        let thresholdDelta = this._tileWidth / 2;
        return value < thresholdDelta;
    }

}
