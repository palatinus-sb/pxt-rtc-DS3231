enum DateTime {
    Hour = 0,
    Minute = 1,
    Second = 2,
    Weekday = 3,
    Day = 4,
    Month = 5,
    Year = 6
}
/**
 * RT Clock
 */
//% weight=100 color=#00b370 icon="\uf017" block="RT Clock"
namespace rtc {
    let ampm = false
    const addr = 0x68
    /**
     * Returns the specified member of DateTime 
     * needs 1 enum DateTime parameter
     */
    //% block
    export function getTime(t: DateTime): number {
        switch (t) {
            case DateTime.Second:
                return decode(getReg(0x00))
                break
            case DateTime.Minute:
                return decode(getReg(0x01))
                break
            case DateTime.Hour:
                let H = decode(getReg(0x02))
                if (ampm && H > 12)
                    return H - 12
                else if (ampm && H == 0)
                    return 12
                else
                    return H
                break
            case DateTime.Weekday:
                return decode(getReg(0x03))
                break
            case DateTime.Day:
                return decode(getReg(0x04))
                break
            case DateTime.Month:
                return decode(getReg(0x05))
                break
            case DateTime.Year:
                return decode(getReg(0x06)) + 2000
                break
            default:
                return -1
                break
        }
    }
    /**
     * Sets the time to a specific value 
     * takes 3 arguments (hour, minute, second)
     */
    //% block
    export function setTime(hour: number, minute: number, second: number): void {
        if (!(hour >= 0 && hour < 24 && minute >= 0 && minute < 60 && second >= 0 && second < 60)) return
        setReg(0x02, encode(hour))
        setReg(0x01, encode(minute))
        setReg(0x00, encode(second))
    }
    /**
     * Sets the date to a specific value, automatically calculates the weekday
     * takes 3 arguments (year, month, day)
     */
    //% block
    export function setDate(year: number, month: number, day: number): void {
        if (!(year >= 2000 && year < 2100 && month > 0 && month <= 12 && day > 0 && day <= 31)) return
        setReg(0x06, encode(year - 2000))
        setReg(0x05, encode(month))
        setReg(0x04, encode(day))
        setReg(0x03, encode(DayOfTheWeek()))
    }
    /**
     * Returns the time as a string in the format "23:59:59"
     */
    //% block
    export function stringTime(): string {
        let str = ""
        let H = getTime(DateTime.Hour)
        let M = getTime(DateTime.Minute)
        let S = getTime(DateTime.Second)
        H < 10 ? str += "0" : str += ""
        str += H
        M < 10 ? str += ":0" : str += ":"
        str += M
        S < 10 ? str += ":0" : str += ":"
        str += S
        return str
    }
    /**
     * Returns the date as a string in the format "2000.12.31"
     */
    //% block
    export function stringDate(): string {
        let str = ""
        let M = getTime(DateTime.Month)
        let D = getTime(DateTime.Day)
        str += getTime(DateTime.Year)
        M < 10 ? str += ".0" : str += "."
        str += M
        D < 10 ? str += ".0" : str += "."
        str += D + "."
        return str
    }
    /**
     * Returns the date as a string in the format "Monday"
     */
    //% block
    export function stringWeekday(): string {
        switch (getTime(DateTime.Weekday)) {
            case 1: return "Monday";
            case 2: return "Tuesday";
            case 3: return "Wednesday";
            case 4: return "Thursday";
            case 5: return "Friday";
            case 6: return "Saturday";
            case 7: return "Sunday";
            default: return "";
        }
    }
    /**
     * Enables or disables the 12 hour clock
     */
    //% block
    export function enableAmPm(value: boolean): void {
        ampm = value
    }
    /**
     * Returns true if the 12 hour clock is enabled,
     * otherwise false
     */
    //% block
    export function getAmPm(): boolean {
        return ampm
    }
    function setReg(reg: number, dat: number): void {
        let buf = pins.createBuffer(2)
        buf[0] = reg
        buf[1] = dat
        pins.i2cWriteBuffer(addr, buf)
    }
    function getReg(reg: number): number {
        pins.i2cWriteNumber(addr, reg, NumberFormat.UInt8BE)
        return pins.i2cReadNumber(addr, NumberFormat.UInt8BE)
    }
    function decode(dat: number): number {
        let x = dat & 127
        x = (x & 15) + 10 * ((x & (15 << 4)) >> 4)
        return x
    }
    function encode(dat: number): number {
        return Math.idiv(dat, 10) * 16 + (dat % 10)
    }
    function DayOfTheWeek(): number {
        let dow: number
        let mArr = [6, 2, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4]
        dow = (getTime(DateTime.Year) % 100)
        dow = dow * 1.25
        dow += getTime(DateTime.Day);
        dow += mArr[getTime(DateTime.Month) - 1]
        if (((getTime(DateTime.Year) % 4) == 0) && (getTime(DateTime.Month) < 3))
            dow -= 1
        while (dow > 7)
            dow -= 7
        return dow
    }
}
/**
 * Countdown
 */
//% weight=100 color=#00b3b3 icon="\uf252" block="Countdown"
//% advanced=true
namespace countdown {
    let cdstate = false
    let end: number
    /**
     * Starts the countdown of X seconds
     */
    //% block
    export function start(secs: number): void {
        end = input.runningTime() + secs * 1000
        cdstate = true
    }
    /**
     * Stops and resets the countdown
     */
    //% block
    export function stop(): void {
        cdstate = false
    }
    /**
     * Returns true if cd is initiated, otherwise false
     */
    //% block
    export function state(): boolean {
        return cdstate
    }
    /**
     * Returns the remaining time in Secs
     * e.g. 01:12 -> 72 Secs
     */
    //% block
    export function remainingTime(): number {
        if (cdstate && Math.floor((end - input.runningTime()) / 1000) > 0) {
            return Math.floor((end - input.runningTime()) / 1000)
        } else return 0
    }
}
namespace input {
    /**
     * Gets the temperature from the RTC in Celsius degrees (°C)
     */
    //% block
    export function temperature2() {
        let buf = pins.createBuffer(2)
        buf[0] = 0x0e
        buf[1] = 0x3c
        pins.i2cWriteBuffer(0x68, buf)
        basic.pause(1)
        pins.i2cWriteNumber(0x68, 0x11, NumberFormat.UInt8BE)
        let x = pins.i2cReadNumber(0x68, NumberFormat.UInt8BE) & 127
        x = (x & 15) + 10 * ((x & (15 << 4)) >> 4)
        return x
    }
}