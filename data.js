const subjectsData = {
    ICT: [
        "තොරතුරු සහ සන්නිවේදන තාක්ෂණය පිළිබඳ සංකල්ප (Concept of ICT)",
        "පරිගණකයට හැඳින්වීමක් (Introduction to Computer)",
        "දත්ත නිරූපණය (Data Representation)",
        "මූලික අංකිත පරිපථ (Fundamental of Digital Circuits)",
        "පරිගණක මෙහෙයුම් පද්ධති (Computer Operating Systems)",
        "දත්ත සන්නිවේදනය හා ජාලකරණය (Data Communication and Networking)",
        "පද්ධති විශ්ලේෂණය හා පිරිසැලසුම (Systems analysis and Design)",
        "දත්ත සමුදාය කළමනාකරණය (Database Management)",
        "ක්‍රමලේඛනය (Programming)",
        "වෙබ් අඩවි සංවර්ධනය (Web Development)",
        "සාර්ව ද්‍රව්‍ය අන්තර්ජාලය (Internet of Things)",
        "ව්‍යාපාර තුළ තොරතුරු සන්නිවේදන තාක්ෂණය (ICT in Business)",
        "තොරතුරු සන්නිවේදන තාක්ෂණයේ නව නැඹුරු සහ අනාගත දිශානති (New Trends)"
    ],
    SFT: [
        "වර්ගඵලය හා පරිමාව පිළිබඳ විමර්ශනය",
        "විවිධ මිනුම් සඳහා යෝග්‍ය මිනුම් ඒකක සහ මිනුම් උපකරණ භාවිතය",
        "පයිතගරස් සම්බන්ධතාව",
        "සෛලීය සංවිධානයක් සහිත ජීවීන් තාක්ෂණය සඳහා උපයෝගී කර ගැනීම",
        "බලය සහ එහි ආචරණ",
        "කාර්යය, ශක්තිය සහ ජවය",
        "ත්‍රිකෝණමිතික අනුපාත",
        "භ්‍රමණ චලිත",
        "විදුලි උපකරණ නඩත්තු කිරීම සහ පරිපථ",
        "තාපය පිළිබඳ දැනුම",
        "තාප රසායනය",
        "චාලක රසායන විද්‍යාව",
        "කාබනික සංයෝග, ජෛවාණුවල ව්‍යුහය",
        "බහු අවයවික භාවිතය",
        "පදාර්ථයේ යාන්ත්‍රික ගුණ",
        "නිශ්චල සහ චලිත වන තරල",
        "රසායනික කර්මාන්ත",
        "ස්වභාව නිෂ්පාදනය හා නිස්සාරණ විධි",
        "කාටිසියානු ඛණ්ඩාංක තලය",
        "විස්තරාත්මක සංඛ්‍යානය",
        "පරිගණක පද්ධතියක් සහ උපාංග",
        "පරිගණක මෙහෙයුම් පද්ධතිය",
        "යෙදුම් මෘදුකාංග",
        "අන්තර්ජාලය",
        "තාක්ෂණික දියුණුව පාරිසරික සමතුලිතතාව කෙරෙහි බලපාන ආකාරය"
    ],
    BST: [
        "ජෛව පද්ධති සඳහා සුදුසු කාලගුණික තත්ත්ව",
        "ජෛව පද්ධති ආශ්‍රිත පස",
        "බිම් මැනීමේ සහ මට්ටම් ගැනීමේ සූදානම",
        "ජල ප්‍රභව පිළිබඳ විමර්ශනය",
        "ජලයේ ගුණාත්මක බව",
        "ගුණාත්මක පැළ නිෂ්පාදනය",
        "ජලජ ජීව සම්පත් කර්මාන්තය",
        "සත්ත්ව නිෂ්පාදනය",
        "ගුණාත්මක ආහාර නිෂ්පාදනය",
        "පසු අස්වනු තාක්ෂණ ශිල්ප ක්‍රම",
        "පාලිත පරිසර තත්ත්ව භාවිතය",
        "යාන්ත්‍රීක කරණය",
        "දැවමය හා දැවමය නොවන නිෂ්පාදන පරිභෝජනය",
        "වැවිලි බෝග හා සුලු අපනයන බෝග ආශ්‍රිත නිෂ්පාදන",
        "ක්‍රියාවලි පාලනය හා ස්වයංක්‍රීයකරණය",
        "වෘත්තීමය ආරක්ෂාව හා සෞඛ්‍ය",
        "උද්‍යාන විද්‍යාව",
        "පරිසර හිතකාමී ක්‍රමෝපායයන්",
        "නිෂ්පාදන සහ ව්‍යාපාර සංවර්ධනය"
    ]
};

const fullNames = {
    ICT: "Information and Communication Technology (ICT)",
    SFT: "Science for Technology (SFT)",
    BST: "Bio Systems Technology (BST)"
};

const paperLinks = {
    ICT: {
        2020: "https://drive.google.com/file/d/1bCfZDiBiZUOCi8uXimB839DorZuLUaYq/view?usp=sharing",
        2021: "https://drive.google.com/file/d/1aSvtR9cG49YM55Au7yXBLlHo4ZeiXvIu/view?usp=sharing",
        2022: "https://drive.google.com/file/d/1U4y8uZlvpV1j4CrE2TyY7NPnmG0e0HAx/view?usp=sharing",
        2023: "https://drive.google.com/file/d/17zqJpX8fMUEWx87MA_rdRhzih13KCBMM/view?usp=sharing",
        2024: "https://drive.google.com/file/d/1eXUGEti-nJiL_amSdEn1rTk_Q1W4Mpna/view?usp=sharing",
        2025: "https://drive.google.com/drive/my-drive"
    },
    SFT: {
        2020: "https://drive.google.com/file/d/1-529-baMYuBdxRwl_MI6WLnIJBEG7Hh7/view?usp=sharing",
        2021: "https://drive.google.com/file/d/1QOQVVdfPRh5WAbjIqOWKiW5y3mRpBNRT/view?usp=sharing",
        2022: "https://drive.google.com/file/d/1RaCStGF1rvtIH9ph16fl6FCVi0pqJBEz/view?usp=sharing",
        2023: "https://drive.google.com/file/d/1CVIahJ9Ay02cvmxmgmuF1HET2h0WdbDH/view?usp=sharing",
        2024: "https://drive.google.com/file/d/10paF0WRiCJFx1ZQdHqdF0REKnkH8zjtV/view?usp=sharing",
        2025: "https://drive.google.com/file/d/1jiWegtSxulo2CVB_DMe_ODELwRzOOEFi/view?usp=sharing"
    },
    BST: {
        2020: "https://drive.google.com/file/d/1Of5Y0ex-m_yZlYfPaWhnVCPScrlTzke1/view?usp=sharing",
        2021: "https://drive.google.com/file/d/1Suj9KwIAcIbR5nsVkfAqHhX3MHuWmLdo/view?usp=sharing",
        2022: "https://drive.google.com/file/d/1w0b3jaDPOrTOSJo5NOZPLmu18QpYTJ4w/view?usp=sharing",
        2023: "https://drive.google.com/file/d/1Bd6qg01Z6LOvCiFwmw9aL-rBhjJb3SrB/view?usp=sharing",
        2024: "https://drive.google.com/file/d/1UReSZ0_3aIWxsVRfyVBEduG4CDozc9OU/view?usp=sharing",
        2025: "https://drive.google.com/drive/my-drive"
    }
};
