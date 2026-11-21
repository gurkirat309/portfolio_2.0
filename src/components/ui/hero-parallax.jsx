"use client";
import React from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
} from "motion/react";

// Aceternity UI "Hero Parallax", ported from TypeScript to this project's JSX.
// Unchanged from the source except:
// - `Header` takes `title`, `description` and `as` (heading level); the defaults are the source's.
//   HeroParallax passes `header` through to it.
// - ProductCard is h-60 instead of h-96: a 2:1 card shows the portfolio's 2:1 screenshots
//   nearly whole instead of cropping away about 40% of each.
// - The wrapper is sized to its content (pt-40, and room at the bottom for the 500px the rows
//   travel down) instead of a fixed h-[300vh]: with the shorter cards, 300vh left up to a
//   screen of empty space at the end.
// - On phones (below md) cards are 256x128 with 24px gaps, so a whole screenshot fits on screen;
//   from md up they are the 480x240 cards with the source's 80px gaps.
// - On phones the rows drop from -350px to 150px as the wall straightens (source: -700 to 500,
//   kept from md up), with the bottom room to match.

export const HeroParallax = ({
  products,
  header,
}) => {
  const firstRow = products.slice(0, 5);
  const secondRow = products.slice(5, 10);
  const thirdRow = products.slice(10, 15);
  const ref = React.useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const springConfig = { stiffness: 300, damping: 30, bounce: 100 };
  // Phones: a smaller drop as the wall straightens, so the cards sit mid-screen instead of
  // being pushed into the bottom half. From md up these are the source's values.
  const [small] = React.useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches
  );
  const dropFrom = small ? -350 : -700;
  const dropTo = small ? 150 : 500;

  const translateX = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, 1000]),
    springConfig
  );
  const translateXReverse = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, -1000]),
    springConfig
  );
  const rotateX = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [15, 0]),
    springConfig
  );
  const opacity = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [0.2, 1]),
    springConfig
  );
  const rotateZ = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [20, 0]),
    springConfig
  );
  const translateY = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [dropFrom, dropTo]),
    springConfig
  );
  return (
    <div
      ref={ref}
      className="pt-40 pb-[calc(150px+2.5rem)] md:pb-[calc(500px+2.5rem)] overflow-hidden  antialiased relative flex flex-col self-auto [perspective:1000px] [transform-style:preserve-3d]"
    >
      <Header {...header} />
      <motion.div
        style={{
          rotateX,
          rotateZ,
          translateY,
          opacity,
        }}
        className=""
      >
        <motion.div className="flex flex-row-reverse space-x-reverse space-x-6 md:space-x-20 mb-6 md:mb-20">
          {firstRow.map((product) => (
            <ProductCard
              product={product}
              translate={translateX}
              key={product.title}
            />
          ))}
        </motion.div>
        <motion.div className="flex flex-row  mb-6 md:mb-20 space-x-6 md:space-x-20 ">
          {secondRow.map((product) => (
            <ProductCard
              product={product}
              translate={translateXReverse}
              key={product.title}
            />
          ))}
        </motion.div>
        <motion.div className="flex flex-row-reverse space-x-reverse space-x-6 md:space-x-20">
          {thirdRow.map((product) => (
            <ProductCard
              product={product}
              translate={translateX}
              key={product.title}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export const Header = ({
  title = (
    <>
      The Ultimate <br /> development studio
    </>
  ),
  description = "We build beautiful products with the latest technologies and frameworks. We are a team of passionate developers and designers that love to build amazing products.",
  as: Heading = "h1",
  id,
}) => {
  return (
    <div className="max-w-7xl relative mx-auto py-20 md:py-40 px-4 w-full  left-0 top-0">
      <Heading id={id} className="text-2xl md:text-7xl font-bold dark:text-white">
        {title}
      </Heading>
      <p className="max-w-2xl text-base md:text-xl mt-8 dark:text-neutral-200">
        {description}
      </p>
    </div>
  );
};

export const ProductCard = ({
  product,
  translate,
}) => {
  return (
    <motion.div
      style={{
        x: translate,
      }}
      whileHover={{
        y: -20,
      }}
      key={product.title}
      className="group/product h-32 w-[16rem] md:h-60 md:w-[30rem] relative shrink-0"
    >
      <a
        href={product.link}
        className="block group-hover/product:shadow-2xl "
      >
        <img
          src={product.thumbnail}
          height="600"
          width="600"
          className="object-cover object-left-top absolute h-full w-full inset-0"
          alt={product.title}
        />
      </a>
      <div className="absolute inset-0 h-full w-full opacity-0 group-hover/product:opacity-80 bg-black pointer-events-none"></div>
      <h2 className="absolute bottom-4 left-4 opacity-0 group-hover/product:opacity-100 text-white">
        {product.title}
      </h2>
    </motion.div>
  );
};
