
import { inject } from 'aurelia-framework';
import { DragService } from 'resources/services/drag-service';
import { EventAggregator } from 'aurelia-event-aggregator';
@inject(DragService, EventAggregator)

export class BoardCustomElement {

    constructor(dragService, eventAggregator) {
        this.dragService = dragService;
        this._eventAggregator = eventAggregator;
        this.boardSize = 7;
        this.distance = 9.666;
        this.offset = 2;
        this.row = new Array(this.boardSize).fill().map(t => 1);
        this.board = new Array(this.boardSize).fill().map(r => this.row.slice());
    }

    attached() {

        this.startDragListener = this._eventAggregator.subscribe('startDrag', tile => {
            this._draggedTileValue = this.board[tile.y][tile.x];
            this._draggedTileCoordinates = {
                x: tile.x,
                y: tile.y
            };
            this._releaseTile = false;
            this._$tile = $(tile.element);
            this._$tile.addClass('dragging');
            this._startPosition = {
                left: tile.left,
                top: tile.top
            };
            this._displacement = {
                left: 0,
                top: 0
            };
        });

        this.doDragListener = this._eventAggregator.subscribe('doDrag', tile => {

            if (!this._releaseTile) {
                this._displacement.left += tile.left;
                this._displacement.top += tile.top;
                this._tileWidth = this._$tile.width() / 9.666 * 11.666;
                let targetX = this._draggedTileCoordinates.x;
                let targetY = this._draggedTileCoordinates.y;
                if (this._displacement && Math.abs(this._displacement.left) > Math.abs(this._displacement.top)) {
                    if (this._underTreshold(this._displacement.left)) {
                        this._moveTile(this._displacement.left / 2, 0);
                    } else {
                        let sign = Math.sign(this._displacement.left);
                        targetX += sign;
                        let targetTileValue = this.board[targetX][targetY];
                        this._releaseTile = true;
                        if (this._draggedTileValue == targetTileValue) {
                            this._moveTile(sign * this._tileWidth, 0);
                            this._removeTile();
                        } else {
                            this._resetTile();
                        }
                    }
                } else {
                    if (this._underTreshold(this._displacement.top)) {
                        this._moveTile(0, this._displacement.top / 2);
                    } else {
                        let sign = Math.sign(this._displacement.top);
                        targetY += sign;
                        let targetTileValue = this.board[targetX][targetY];
                        this._releaseTile = true;
                        if (this._draggedTileValue == targetTileValue) {
                            this._moveTile(0, sign * this._tileWidth);
                            this._removeTile();
                        } else {
                            this._resetTile();
                        }
                        this._moveTile(0, Math.sign(this._displacement.top) * this._tileWidth);
                        this._removeTile();
                    }
                }
            }

        });

        this.stopDragListener = this._eventAggregator.subscribe('stopDrag', tile => {
            if (this._underTreshold(this._displacement.left) && this._underTreshold(this._displacement.top)) {
                this._$tile.addClass('retracted');
                this._moveTile(0, 0);
            }
            this._releaseTile = true;
            this._$tile.removeClass('dragging');
        });
    }

    _resetTile() {
        this._moveTile(0, 0);
        setTimeout(() => {
            this._$tile.removeClass('dragging attracted retracted');
        }, 500);
    }

    _removeTile() {
        setTimeout(() => {
            this._$tile.remove();
        }, 500);
    }

    _moveTile(x, y) {
        this._$tile.css({
            transform: 'translate(' + x + 'px, ' + y + 'px)'
        });
    }

    _underTreshold(distance) {
        let thresholdDistance = this._tileWidth / 2;
        return Math.abs(distance) < thresholdDistance;
    }

    detached() {
        this.startDragListener.dispose();
        this.doDragListener.dispose();
        this.stopDragListener.dispose();
    }
}
