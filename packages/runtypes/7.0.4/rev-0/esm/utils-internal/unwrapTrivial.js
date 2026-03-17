import Runtype from "../Runtype.js";
const unwrapTrivial = (runtype) => {
    Runtype.assertIsRuntype(runtype);
    switch (runtype.tag) {
        case "brand":
            return unwrapTrivial(runtype.entity);
        case "intersect":
            if (runtype.intersectees.length === 1)
                return unwrapTrivial(runtype.intersectees[0]);
            break;
        case "union":
            if (runtype.alternatives.length === 1)
                return unwrapTrivial(runtype.alternatives[0]);
            break;
    }
    return runtype;
};
export default unwrapTrivial;
