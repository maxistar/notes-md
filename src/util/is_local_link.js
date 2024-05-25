export const isLocalLink = (linkFound) => {

        if (linkFound.indexOf('mailto:') === 0) {
                    return false;
        }
        if (linkFound.indexOf('http://') === 0) {
            return false;
        }
        if (linkFound.indexOf('https://') === 0) {
            return false;
        }
        if (linkFound.indexOf('file://') === 0) {
            return false;
        }
        if (linkFound.indexOf('git@') === 0) {
            return false;
        }
        if (linkFound.indexOf('#') === 0) {
            return false;
        }
        return true;
    }