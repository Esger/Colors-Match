
import { inject } from 'aurelia-framework';
import { DragService } from 'resources/services/drag-service';
import { EventAggregator } from 'aurelia-event-aggregator';
import { BindingSignaler } from 'aurelia-templating-resources';
@inject(DragService, EventAggregator, BindingSignaler)

export class BoardCustomElement {

    constructor(dragService, eventAggregator, bindingSignaler) {
        this.dragService = dragService;
        this._bindingSignaler = bindingSignaler;
        this._eventAggregator = eventAggregator;
        this._boardSize = 7;
        this._center = Math.floor(this._boardSize / 2);
        this._highestValue = 1;
        this._score = 0;
        this._row = new Array(this._boardSize).fill().map(t => 1);
        this.board = new Array(this._boardSize).fill().map(r => this._row.slice());
        this.showBoard = true;
        this.distance = 9.666;
        this.offset = 2;
    }

    attached() {
        this._tileWidth = $('tile').width() / 9.666 * 11.666;

        this.startDragListener = this._eventAggregator.subscribe('startDrag', tile => {
            this._draggedValue = this.board[tile.y][tile.x];
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
        });

        this.doDragListener = this._eventAggregator.subscribe('doDrag', tile => {

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
                    let targetValue = this.board[target[0]][target[1]];
                    this._releaseTile = true;
                    if (this._draggedValue == targetValue) {
                        this._moveTile(signs[1] * this._tileWidth, signs[0] * this._tileWidth);
                        this._doubleTile(target);
                        setTimeout(() => {
                            this._shiftTiles(signs);
                        }, 500);

                    } else {
                        this._resetTile();
                    }
                }
            }

        });

        this.stopDragListener = this._eventAggregator.subscribe('stopDrag', tile => {
            if (this._underTreshold(this._oneDelta)) {
                this._$tile.addClass('retracted');
                this._moveTile(0, 0);
            }
            this._releaseTile = true;
            setTimeout(() => {
                this._$tile.removeClass('dragging retracted');
            }, 300);
        });
    }

    _shiftTiles(signs) {
        this._$tile.remove();
        let offset = signs.slice();
        let dataId = 'tile_' + (this._dragTileIndex[0] - offset[0]) + '-' + (this._dragTileIndex[1] - offset[1]);
        let $tiles = [];
        let $tile = $('[data-id=' + dataId + ']');
        let toIndex = this._dragTileIndex.slice();
        let fromIndex = toIndex.slice();
        fromIndex[0] = toIndex[0] - signs[0];
        fromIndex[1] = toIndex[1] - signs[1];
        while ($tile.length) {
            this.board[toIndex[0]][toIndex[1]] = this.board[fromIndex[0]][fromIndex[1]];
            $tiles.push($tile);
            fromIndex[0] = toIndex[0] - signs[0];
            fromIndex[1] = toIndex[1] - signs[1];
            offset[0] += signs[0];
            offset[1] += signs[1];
            dataId = 'tile_' + (this._dragTileIndex[0] - offset[0]) + '-' + (this._dragTileIndex[1] - offset[1]);
            $tile = $('[data-id=' + dataId + ']');
        }
        this.board[toIndex[0]][toIndex[1]] = Math.ceil(Math.random() * this._highestValue);
        let dx = signs[1] * this._tileWidth;
        let dy = signs[0] * this._tileWidth;
        let dt = 50;
        $tiles.forEach($t => {
            $t.addClass('follow');
            setTimeout(() => {
                // $t.animate({ top: dx, left: dy }, 100, 'easeOutBounce');
                $t.css({
                    transform: 'translate(' + dx + 'px, ' + dy + 'px)'
                });
            }, dt);
            dt += 50;
        });
        this._bindingSignaler.signal('update-id');
        this._bindingSignaler.signal('update-value');
        console.table(this.board);
    }

    _doubleTile(pos) {
        this._$tile.addClass('correct');
        let value = this.board[pos[0]][pos[1]];
        this._score += value;
        this.board[pos[0]][pos[1]] *= 2;
        this._highestValue = (pos[0] == pos[1] && pos[0] == this._center) ? Math.max(this._highestValue, this.board[pos[0]][pos[1]]) : this._highestValue;
        this._eventAggregator.publish('score', value);
        this._eventAggregator.publish('high', this._highestValue);
        this._bindingSignaler.signal('update-value');
    }

    _resetTile() {
        this._$tile.addClass('incorrect');
        this._moveTile(0, 0);
        setTimeout(() => {
            this._$tile.removeClass('dragging attracted retracted incorrect');
        }, 500);
    }

    _moveTile(x, y) {
        this._$tile.css({
            transform: 'translate(' + x + 'px, ' + y + 'px)'
        });
    }

    _underTreshold(constrainedDistance) {
        let value = Math.max(Math.abs(constrainedDistance[0]), Math.abs(constrainedDistance[1]));
        let thresholdDelta = this._tileWidth / 2;
        return value < thresholdDelta;
    }

    detached() {
        this.startDragListener.dispose();
        this.doDragListener.dispose();
        this.stopDragListener.dispose();
    }
}
