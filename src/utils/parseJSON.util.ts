const parseJSON = () => { 
    let data: messageType = null;

    try {
        data = JSON.parse(message.toString());
    } catch {
                
    }

    return data;
};