import { inject, bindable } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { DragService } from 'resources/services/drag-service';

@inject(Element, DragService, EventAggregator)
export class TileCustomElement {
    @bindable tile;
    @bindable rowTileCount;
    @bindable maxColors;
    @bindable win;

    constructor(element, dragService, eventAggregator) {
        this.dragService = dragService;
        this._eventAggregator = eventAggregator;
        this._element = element;
        this._allowedDirections = [];
        this.locked = false;
        this.animated = false;
        this.correct = false;
        this.dragged = false;
        this.visible = true;
        this.burn = false;
        this.onfire = false;
        this.dx = 0;
        this.dy = 0;
    }

    attached() {
        this._setRandomColor();
        this.tile.maxColors = this.maxColors;
        this.tile.setRandomColor = this._setRandomColor;
        this._allowedDirections = [this._allowed(this.tile.y), this._allowed(this.tile.x)];
        this._addListeners();
    }

    detached() {
        this._animateListener.dispose();
        this._burnListener.dispose();
        this._correctMoveListener.dispose();
        this._doDragListener.dispose();
        this._lockListener.dispose();
        this._onfireListener.dispose();
        this._resetMoveListener.dispose();
        this._startDragListener.dispose();
        this._stopDragListener.dispose();
        this._unlockListener.dispose();
    }

    _addListeners() {
        this._burnListener = this._eventAggregator.subscribe('burn', () => {
            this.burn = true;
        });

        this._onfireListener = this._eventAggregator.subscribe('onfire', tile => {
            if (tile.id == this.tile.id) {
                this.onfire = true;
            }
        });

        this._animateListener = this._eventAggregator.subscribe('move', move => {
            if (move.tile.id == this.tile.id) {
                this._animate(move.directions, move.animate);
            }
        });

        this._correctMoveListener = this._eventAggregator.subscribe('correct', tile => {
            if (tile.id == this.tile.id) {
                this.correct = true;
                setTimeout(() => {
                    this.correct = false;
                    this._setNextColor();
                });
            }
        });

        this._lockListener = this._eventAggregator.subscribe('lockTiles', tile => {
            if (tile.element.id != this.tile.id) {
                this.locked = true;
            }
        });

        this._unlockListener = this._eventAggregator.subscribe('unlockTiles', () => {
            this.locked = false;
        });

        this._resetMoveListener = this._eventAggregator.subscribe('reset', move => {
            if (move.tile.id == this.tile.id) {
                console.log('incorrect move');
                this.animated = true;
                this.visible = true;
                this.incorrect = true;
                this.dx = 0;
                this.dy = 0;
                setTimeout(() => {
                    this.incorrect = false;
                }, 400);
            }
        });

        this._startDragListener = this._eventAggregator.subscribe('startDrag', tile => {
            if (tile.element.id == this.tile.id) {
                this._startDragHandler(tile);
            }
        });

        this._doDragListener = this._eventAggregator.subscribe('doDrag', tile => {
            if (tile.element.id == this.tile.id) {
                this._doDragHandler(tile);
            }
        });

        this._stopDragListener = this._eventAggregator.subscribe('stopDrag', tile => {
            if (tile.element.id == this.tile.id) {
                this._stopDragHandler();
            }
        });

    }

    _allowed(value) {
        // value is tile x or y
        // returns -1, 0 or 1
        switch (value) {
            case 0: return 1; // only increment allowed
            case this.rowTileCount - 1: return -1; // only decrement allowed
            default: return 0; // both allowed
        }
    }

    _animate(directions, animate = true) {
        this.animated = animate;
        setTimeout(() => {
            this.dy = directions[0];
            this.dx = directions[1];
        });
    }

    _startDragHandler(tile) {
        this.dragged = true;
        this._startPosition = {
            left: tile.left,
            top: tile.top
        };
        this._delta = [0, 0];
        this._oneDelta = [0, 0];
    }

    _directionAllowed(direction, delta) {
        const allowed = this._allowedDirections[direction] != -delta; // 0 and delta is allowed
        return allowed;
    }

    _drag(directions) {
        this.dragged = true;
        this.animated = false;
        // for elastic effect
        this.dy = (directions[0] / 2) + 'px';
        this.dx = (directions[1] / 2) + 'px';
    }

    _doDragHandler(tile) {
        if (this.dragged) {
            this._delta[1] += tile.dx; // px
            this._delta[0] += tile.dy;  // px
            // absolute delta values in px to determine the largest of the two
            const absDelta = [Math.abs(this._delta[0]), Math.abs(this._delta[1])];

            // only the largest delta is set in px; the other is zeroed to constrain move
            const direction = (absDelta[1] > absDelta[0]) ? 1 : 0; // x
            const delta = this._delta[direction]; // px
            this._oneDelta = [0, 0];    // px
            this._oneDelta[direction] = delta;

            this._directions = [Math.sign(this._oneDelta[0]), Math.sign(this._oneDelta[1])];
            if (this._directionAllowed(direction, this._directions[direction])) {
                this._eventAggregator.publish('lockTiles', tile);
                if (this._underTreshold(this._oneDelta)) {
                    this._drag(this._oneDelta);
                } else {
                    // oneDelta mapped to -1 / 0 / 1
                    this.dragged = false;
                    let vector = {
                        tile: this.tile,
                        directions: this._directions
                    };
                    this._eventAggregator.publish('request-move', vector);
                }
            } else {
                this.dragged = false;
            }

        }
    }

    _stopDragHandler() {
        if (this.dragged) {
            this.dragged = false;
            if (this._underTreshold(this._oneDelta)) {
                this._animate([0, 0]);
                this._eventAggregator.publish('unlockTiles');
            }
        }
    }

    _underTreshold(constrainedDistance) {
        let value = Math.max(Math.abs(constrainedDistance[0]), Math.abs(constrainedDistance[1]));
        return value < 40;
    }

    _setRandomColor = (maxColors = 2) => {
        this.tile.color = Math.ceil(Math.random() * maxColors);
    }

    _setNextColor() {
        this.tile.color = (this.tile.color == this.maxColors) ? 1 : this.tile.color + 1;
    }

}
