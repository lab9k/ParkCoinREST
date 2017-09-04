function printContract(){
    return "Hello World!";
}

module.exports = {
    print:function(){
        return printContract();
    }
}