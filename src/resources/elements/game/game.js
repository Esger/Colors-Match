import { inject } from 'aurelia-framework';
import { DragService } from 'resources/services/drag-service';

@inject(DragService)
export class GameCustomElement {

    constructor(dragService) {
        this.dragService = dragService;
        this.title = '1+1';
    }

}