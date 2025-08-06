import os from "os";

// This function retrieves the local IP address of the machine.
const getLocalIP = (): string | undefined => {
    const interfaces = os.networkInterfaces();
    const localIP = Object.values(interfaces)
        .flat()
        .find((i) => i?.family === "IPv4" && !i.internal)?.address;

    return localIP;    
};

export default getLocalIP;
