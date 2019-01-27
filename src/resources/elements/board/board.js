import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';

@inject(EventAggregator)
export class BoardCustomElement {

    constructor(eventAggregator) {
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
        let tile = {
            animated: false,
            classList: 'tile',
            dragged: false,
            id: 'tile_' + y + '-' + x,
            isCenter: (x == y) && (x == this._center),
            timer: undefined,
            value: 1,
            visible: true,
            x: x,
            y: y,
            dx: 0,
            dy: 0,
            $tileCache: undefined,
            $tile: () => {
                if (tile.$tileCache) {
                    return tile.$tileCache;
                } else {
                    tile.$tileCache = $('#' + tile.id);
                    return tile.$tileCache;
                }
            },
            drag: (directions) => {
                tile.addClass('dragged');
                tile.animated = false;
                setTimeout(() => {
                    // for elastic effect
                    tile.dy = (directions[0] / 2) + 'px';
                    tile.dx = (directions[1] / 2) + 'px';
                    console.log(tile.dy, tile.dx);
                });
                clearTimeout(tile.timer);
                // make sure the className gets deleted again
                tile.timer = setTimeout(() => {
                    tile.removeClass('dragged');
                    this.dragged = false;
                }, 500);
            },
            animate: (directions, className, delay) => {
                tile.animated = true;
                tile.addClass(className);
                setTimeout(() => {
                    tile.dy = directions[0] * this.distance + 'vmin';
                    tile.dx = directions[1] * this.distance + 'vmin';
                    console.log(tile.dy, tile.dx);
                }, delay);
            },
            doubleUp: () => {
                tile.addClass('correct');
                setTimeout(() => {
                    tile.removeClass('correct');
                }, 1000);
                this._eventAggregator.publish('score', tile.value);
                tile.value *= 2;
                if (tile.isCenter) {
                    this._eventAggregator.publish('high', tile.value);
                }
            },
            hide: () => { tile.visible = false; },
            show: () => { tile.visible = true; },
            addClass: className => {
                if (tile.classList.indexOf(className) < 0) {
                    tile.classList += ' ' + className;
                    console.log(tile.classList);
                }
            },
            removeClass: className => {
                let classArray = tile.classList.split(' ');
                const classIndex = classArray.indexOf(className);
                if (classIndex > 0) {
                    classArray.splice(classIndex, 1);
                    tile.classList = classArray.join(' ');
                }
            },
            resetClassNames: () => {
                tile.classList = 'tile';
            }
        };
        return tile;
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
        // $('.tile').removeClass('incorrect correct follow attracted retracted onfire burn dragging');
    }

    attached() {
        this._newBoard();

        setTimeout(() => {
            let $tiles = $('.tile');
            this._tileWidth = $tiles.width() / this.distance * (this.distance + 2);
            // need to calc this in px cuz everything is in vmin
            // this._tileDistancePx = $($tiles[1]).position().left - $tiles.first().position().left;
        });
        this._addListeners();
    }

    detached() {
        this._removeListeners();
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

    _removeListeners() {
        this.startDragListener.dispose();
        this.doDragListener.dispose();
        this.stopDragListener.dispose();
        this.restartListener.dispose();
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
            // this._$tile = $(tile.element);
            this._currentTile = this.board[tile.y][tile.x];
            this._releaseTile = false;
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
            this._delta[1] += tile.left; // px
            this._delta[0] += tile.top; // px
            let absDelta = [Math.abs(this._delta[0]), Math.abs(this._delta[1])]; //px
            this._oneDelta = (absDelta[1] > absDelta[0]) ? [0, this._delta[1]] : [this._delta[0], 0]; //px
            this._signs = [Math.sign(this._oneDelta[0]), Math.sign(this._oneDelta[1])]; // -1 / 0 / 1
            let targetCoordinates = [this._currentTile.y + this._signs[0], this._currentTile.x + this._signs[1]]; // coords
            if (this._withinBoundaries(targetCoordinates)) {
                if (this._underTreshold(this._oneDelta)) {
                    this._currentTile.drag(this._oneDelta, 'dragging');
                } else {
                    this._releaseTile = true;
                    let targetTile = this.board[targetCoordinates[0]][targetCoordinates[1]];
                    if (this._currentTile.value == targetTile.value) {
                        targetTile.doubleUp();
                        this._currentTile.animate(this._signs, 'correct');
                    } else {
                        this._currentTile.animate([0, 0], 'incorrect');
                    }
                }
            }
        }
    }

    _stopDragHandler() {
        if (this._underTreshold(this._oneDelta)) {
            this._currentTile.animate([0, 0], 'dragging');
        } else {
            let tilesBehind = this._findTilesBehind(this._signs);
            // animate the intruding tiles on the board
            let time = this._moveTiles(tilesBehind, this._signs);

            console.log(time);
            setTimeout(() => {
                this._shiftTilesBehind(tilesBehind);
                this._checkGameEnd();
            }, time);
        }
        this._releaseTile = true;
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
        let dt = 50;
        let ddt = 50;
        let Dt = 0;
        this._gameEnd = true;
        $('.tile').addClass('burn');
        this.board.forEach(row => {
            row.forEach(tile => {
                setTimeout(() => {
                    tile.addClass('onfire');
                    setTimeout(() => {
                        tile.removeClass('burn');
                        tile.removeClass('onfire');
                    }, dt);
                }, dt);
                Dt += dt;
                dt += ddt;
            });
        });
    }

    _moveTiles(tiles, signs) {
        const ddt = 200;
        let Dt = 0;
        if (tiles.length) {
            let dt = 100 / tiles.length;
            // the first tile is the dragged one
            tiles[0].hide();
            for (let i = 1; i < tiles.length; i++) {
                const tile = tiles[i];
                let $tile = $('#tile_' + tile[0] + '-' + tile[1]);
                let dx = signs[1] * this._tileWidth;
                let dy = signs[0] * this._tileWidth;
                tile.animate(this._signs, 'follow', dt);
                Dt += dt;
                dt += ddt;
            }
        }
        setTimeout(() => {
            tiles[0].show();
        }, Dt);
        return Dt;
    }

    _withinBoundaries(target) {
        let inRow = target[1] >= 0 && target[1] < this._boardSize;
        let inCol = target[0] >= 0 && target[0] < this._boardSize;
        return inRow && inCol;
    }

    // find the tiles behind the moved tile from the empty place to the wall
    _findTilesBehind(directions) {
        let tilesBehind = [];
        if (this._currentTile) {
            let t = [this._currentTile.y, this._currentTile.x];
            // if one of the directions > 0 then step = -1 (opposite direction)
            let step = directions.some(v => { return v > 0; }) ? -1 : 1;
            let max = (step > 0) ? this._boardSize : -1;
            let start = (directions[0] == 0) ? t[1] : t[0];
            for (let i = start; i != max; i += step) {
                tilesBehind.push(this.board[t[0]][t[1]]);
                t = t.map((pos, j) => { return pos - directions[j]; });
            }
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
            this.board[tiles[i].y][tiles[i].x].value = this.board[tiles[i + 1].y][tiles[i + 1].y].value;
        }
        this.board[tiles[last].y][tiles[last].x].value = this._getRandomPowerOf2();
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

    _underTreshold(constrainedDistance) {
        let value = Math.max(Math.abs(constrainedDistance[0]), Math.abs(constrainedDistance[1]));
        let thresholdDelta = this._tileWidth / 2;
        return value < thresholdDelta;
    }

}
