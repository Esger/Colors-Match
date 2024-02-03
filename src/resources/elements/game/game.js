import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { DragService } from 'resources/services/drag-service';
import { ScoreService } from 'resources/services/score-service';

@inject(DragService, ScoreService, EventAggregator)
export class GameCustomElement {
    title = 'uniColor';
    level = 1;

    constructor(dragService, scoreService, eventAggregator) {
        this.dragService = dragService;
        this._eventAggregator = eventAggregator;
        this._scoreService = scoreService;
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
        this._winSubscription = this._eventAggregator.subscribe('win', level => {
            this.level = level - 1;
            this.levelClass = 'level--' + (level - 1);
        });
        this._restartSubscription = this._eventAggregator.subscribe('restart', () => {
            this.level = 1;
            this.levelClass = 'level--0';
        });
    }

    restart() {
        this._eventAggregator.publish('restart');
    }

    detached() {
        this._highSubscription.dispose();
        this._moveSubscription.dispose();
        this._winSubscription.dispose();
        this._restartSubscription.dispose();
    }

}
