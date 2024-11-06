export function getTelegramInstance() {
    return window.Telegram?.WebApp || {
        initDataUnsafe: { user: { id: 'local_user' } },
        BackButton: {
            show: () => console.log('Show back button'),
            hide: () => console.log('Hide back button'),
            onClick: (callback) => console.log('Set back button callback')
        },
        ready: () => console.log('Telegram WebApp ready'),
        close: () => console.log('Close WebApp')
    };
}