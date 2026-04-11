export const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise
        .resolve(requestHandler(req, res, next))
        .catch((err) => next(err))
    }
}



// BOTH FUNCTION ARE DOING THE SAME THING. ONE USING PROMISE AND ONE USING ASYNCAWAIT TRYCATCH
// JUST TWO WAYS TO MAKE THIS WRAPPER





// taking a HOC (Higher Order Function) which is passing a function as a parameter

// const asyncHandler = () => {}
// const asyncHandler = (func) => () => {} 
// const asyncHandler = (func) => { () => {}} this is the real view, we can extract the curly braces for first function

// this is a wrapper function using trycatch 

// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next);
//     } catch (error) {
//         res.status(error.status || 500).json({
//             succes: false, 
//             message: error.message
//         })
//     }
// }