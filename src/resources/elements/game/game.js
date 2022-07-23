import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { DragService } from 'resources/services/drag-service';
import { ScoreService } from 'resources/services/score-service';

@inject(DragService, ScoreService, EventAggregator)
export class GameCustomElement {

    constructor(dragService, scoreService, eventAggregator) {
        this.dragService = dragService;
        this._eventAggregator = eventAggregator;
        this._scoreService = scoreService;
        this._resetScore();
    }

    attached() {
        this.highScore = this._scoreService.getScore();
        this._highSubscription = this._eventAggregator.subscribe('high', value => {
            if (value > this.highScore) {
                this.highScore = value;
                this._scoreService.saveScore(value);
            }
            this.title = value + '+' + value;
        });
        this._moveSubscription = this._eventAggregator.subscribe('moves', moves => {
            this.moves = moves.moves;
        })
        this._resetScoreSubscription = this._eventAggregator.subscribe('reset-score', value => {
            this._resetScore();
        });
    }

    _resetScore() {
        // this.title = 'Colors Match';
    }

    restart() {
        this._eventAggregator.publish('restart');
    }

    detached() {
        this._highSubscription.dispose();
        this._moveSubscription.dispose();
        this._resetScoreSubscription.dispose();
    }

}
