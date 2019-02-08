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
        this.highSubscriber = this._eventAggregator.subscribe('high', value => {
            if (value > this.highScore) {
                this.highScore = value;
                this._scoreService.saveScore(value);
            }
            this.title = value + '+' + value;
        });
        this.resetScoreSubscriber = this._eventAggregator.subscribe('reset-score', value => {
            this._resetScore();
        });
    }

    _resetScore() {
        this.title = '1+1';
    }

    restart() {
        this._eventAggregator.publish('restart');
    }

    detached() {
        this.highSubscriber.dispose();
        this.resetScoreSubscriber.dispose();
    }

}
