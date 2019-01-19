export class idValueConverter {
    toView(id, params) {
        id = 'tile_' + params.y + '-' + params.x;
        return id;
    }
}